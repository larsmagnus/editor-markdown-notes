import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import { DocumentWriter } from '../host/document-updates'

import {
	captureNextPanel,
	isUpdateMessage,
	messagesOfType,
	pause,
	spyOnPostedMessages,
	spyOnReceivedMessages,
	VIEW_TYPE,
} from './webview-panel-restore-support'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

/** Long enough for VS Code to settle a background/reveal transition. */
const RESTORE_SETTLE_MS = 3000

/** Opens a note in the custom editor and hands back the real panel. */
async function openNote(file: vscode.Uri) {
	const capture = captureNextPanel(file)

	try {
		await vscode.commands.executeCommand('vscode.openWith', file, VIEW_TYPE)
		await pause(2000)

		const panel = capture.panel()
		assert.ok(
			panel,
			'resolveCustomTextEditor should have been called for this file'
		)

		return panel
	} finally {
		capture.restore()
	}
}

/** Focuses another tab in the same group, which is what hides this one. */
async function background(panel: vscode.WebviewPanel, otherFile: vscode.Uri) {
	await vscode.window.showTextDocument(otherFile, { preview: false })
	await pause(RESTORE_SETTLE_MS)
	assert.strictEqual(
		panel.visible,
		false,
		'opening another tab in the same group should hide this one'
	)
}

async function reveal(panel: vscode.WebviewPanel) {
	panel.reveal()
	await pause(RESTORE_SETTLE_MS)
	assert.strictEqual(panel.visible, true, 'reveal() should refocus the tab')
}

/**
 * Asserts the panel already holds `content`, without requiring a fresh
 * `update` after the caller reveals it.
 *
 * `retainContextWhenHidden` keeps the page running while hidden, so a
 * `postMessage` sent to it is delivered immediately rather than dropped -
 * unlike the torn-down-and-rebuilt page this suite used to cover, there is no
 * later handshake to wait for. The last `update` posted, whenever it was
 * posted, is what the page has.
 */
function assertHoldsCurrentContent(messages: unknown[], content: string) {
	const updates = messages.filter(isUpdateMessage)

	assert.ok(
		updates.length > 0,
		'the panel should have been told about the change at all'
	)
	assert.deepStrictEqual(updates.at(-1), {
		type: 'update',
		content,
		fileName: 'notes.md',
	})
}

suite('Webview panel restore', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	/**
	 * The instrument every other test here depends on.
	 *
	 * `markdown-editor-provider.ts` sets `retainContextWhenHidden: true`
	 * specifically so a backgrounded tab keeps its running page - and with it,
	 * TipTap's undo history - rather than VS Code discarding it and rebuilding
	 * from the HTML frozen when the note first opened. `useShikiTheme` posts
	 * `getShikiTheme` once per mount, so a second one arriving after the tab is
	 * reshown would mean a page that booted twice; this test is worth more than
	 * the ones below, because a red result here means the flag stopped working
	 * rather than the content-catch-up behaviour it enables being wrong.
	 */
	test('does not rebuild the page when a backgrounded tab is shown again', async function () {
		this.timeout(30_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		const otherFile = vscode.Uri.file(path.join(directory, 'other.md'))
		await fs.writeFile(file.fsPath, '# Original\n\nBefore the edit.\n')
		await fs.writeFile(otherFile.fsPath, '# Somewhere else\n')

		const panel = await openNote(file)
		const spy = spyOnReceivedMessages(panel)

		try {
			await background(panel, otherFile)

			const bootsBefore = messagesOfType(spy.messages, 'getShikiTheme').length

			await reveal(panel)

			assert.strictEqual(
				messagesOfType(spy.messages, 'getShikiTheme').length,
				bootsBefore,
				'the page should not boot again when the tab is reshown - ' +
					'retainContextWhenHidden is what keeps it, and its undo history, alive'
			)
		} finally {
			spy.dispose()
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	/**
	 * The bug report the whole suite grew from, restated the other way: a note
	 * is edited while backgrounded, and the still-running page has to actually
	 * receive that change rather than it being silently dropped for a page that
	 * is not currently visible.
	 */
	test('the panel is told the current content while it is backgrounded', async function () {
		this.timeout(30_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		const otherFile = vscode.Uri.file(path.join(directory, 'other.md'))
		await fs.writeFile(file.fsPath, '# Original\n\nBefore the edit.\n')
		await fs.writeFile(otherFile.fsPath, '# Somewhere else\n')

		const panel = await openNote(file)
		const messages = spyOnPostedMessages(panel)

		try {
			await background(panel, otherFile)

			const document = await vscode.workspace.openTextDocument(file)
			await new DocumentWriter().save(
				document,
				'# Original\n\nAfter the edit.\n'
			)
			assert.strictEqual(document.getText(), '# Original\n\nAfter the edit.\n')

			assertHoldsCurrentContent(messages, '# Original\n\nAfter the edit.\n')

			// Revealing it again must not lose or change what it already has.
			await reveal(panel)
			assertHoldsCurrentContent(messages, '# Original\n\nAfter the edit.\n')
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	/**
	 * Same requirement, reached the way a user is more likely to hit it: the
	 * edit comes from outside the panel entirely - another tab, a different
	 * program, git - while this tab is backgrounded.
	 */
	test('the panel is told the current content after an external edit made while it was backgrounded', async function () {
		this.timeout(30_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		const otherFile = vscode.Uri.file(path.join(directory, 'other.md'))
		await fs.writeFile(file.fsPath, '# Original\n\nBefore the external edit.\n')
		await fs.writeFile(otherFile.fsPath, '# Somewhere else\n')

		const panel = await openNote(file)
		const messages = spyOnPostedMessages(panel)

		try {
			await background(panel, otherFile)

			const document = await vscode.workspace.openTextDocument(file)
			const edit = new vscode.WorkspaceEdit()
			edit.replace(
				document.uri,
				new vscode.Range(0, 0, document.lineCount, 0),
				'# Original\n\nAfter the external edit.\n'
			)
			await vscode.workspace.applyEdit(edit)
			await pause(500)

			assertHoldsCurrentContent(
				messages,
				'# Original\n\nAfter the external edit.\n'
			)

			await reveal(panel)
			assertHoldsCurrentContent(
				messages,
				'# Original\n\nAfter the external edit.\n'
			)
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
