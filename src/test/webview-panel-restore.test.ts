import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import { DocumentWriter } from '../extension/document-updates'

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

/** Long enough for VS Code to tear the page down and boot the bundle again. */
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
 * Asserts the panel was handed `content` at a moment it could actually take
 * it in.
 *
 * The spy sees the host *calling* `postMessage`, not the page receiving it,
 * and VS Code drops a message aimed at a webview that is not live - so an
 * update posted while the tab was hidden proves nothing. Only one sent after
 * the reveal reaches the rebuilt page, which is why the count is taken first.
 */
function assertToldCurrentContent(
	messages: unknown[],
	postedWhileHidden: number,
	content: string
) {
	const updates = messages.filter(isUpdateMessage)

	assert.ok(
		updates.length > postedWhileHidden,
		'a panel back in the foreground should be handed the current text again; ' +
			'the update sent while it was hidden was dropped by VS Code'
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
	 * The bug under investigation is that `attachPanelSession` sets
	 * `webview.html` exactly once, embedding `document.getText()` as
	 * `window.initialContent` at that moment (`webview-document.ts`), and
	 * nothing sets `retainContextWhenHidden`. If VS Code discards a
	 * backgrounded tab's page and rebuilds it from that frozen HTML, the note
	 * comes back showing whatever the file said when it first opened.
	 *
	 * That whole account rests on the page actually being rebuilt, which is not
	 * something the API states. `useShikiTheme` posts `getShikiTheme` once per
	 * mount, so a second one arriving after the tab is reshown is a page that
	 * booted twice - and this test is worth more than the ones below, because a
	 * red result here means the mechanism is wrong rather than the fix missing.
	 */
	test('rebuilds the page when a backgrounded tab is shown again', async function () {
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

			assert.ok(
				messagesOfType(spy.messages, 'getShikiTheme').length > bootsBefore,
				'the page should boot again when the tab is reshown, which is what makes ' +
					'it repaint from the HTML frozen when the note first opened'
			)
		} finally {
			spy.dispose()
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	/**
	 * The bug report: a note is edited, the edit is visibly there, and later the
	 * live editor shows the original content again even though disk still has
	 * the edit.
	 *
	 * A page rebuilt from frozen HTML has no way to learn what changed while it
	 * was gone - edits only ever reach the *running* page as an `update`
	 * postMessage, which does nothing for a page that no longer exists to
	 * receive it. So the panel has to be told the current content once it is
	 * back. Deliberately no assertion about *what* prompts that: a
	 * webview-initiated request on boot and a host-side visibility listener
	 * both satisfy this, and only one of them is safe for a page whose context
	 * survived with unsaved keystrokes in it.
	 */
	test('the panel is told the current content after an edit made while it was backgrounded', async function () {
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

			const postedWhileHidden = messages.filter(isUpdateMessage).length
			await reveal(panel)

			assertToldCurrentContent(
				messages,
				postedWhileHidden,
				'# Original\n\nAfter the edit.\n'
			)
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

			const postedWhileHidden = messages.filter(isUpdateMessage).length
			await reveal(panel)

			assertToldCurrentContent(
				messages,
				postedWhileHidden,
				'# Original\n\nAfter the external edit.\n'
			)
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
