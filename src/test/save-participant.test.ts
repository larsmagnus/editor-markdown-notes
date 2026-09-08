import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import {
	captureNextPanel,
	messagesOfType,
	pause,
	spyOnPostedMessages,
	VIEW_TYPE,
} from '#src/test/webview-panel-restore-support'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

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

suite('Save participant', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	/**
	 * The webview's debounced sync can lag whatever was just typed by up to a
	 * second - `onWillSaveTextDocument` asks the panel for its current text
	 * before VS Code writes the file, rather than saving whatever the
	 * `TextDocument` already happened to hold.
	 */
	test('asks the panel for its current text before writing the file', async function () {
		this.timeout(30_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(file.fsPath, '# Roadmap\n\nShip it.\n')

		const panel = await openNote(file)

		try {
			const document = await vscode.workspace.openTextDocument(file)
			// VS Code does not save a clean document, and does not fire
			// `onWillSaveTextDocument` for one either - this dirties it first, the
			// way `use-note-sync.ts`'s own immediate-sync-on-first-edit would.
			const dirty = new vscode.WorkspaceEdit()
			dirty.replace(
				document.uri,
				new vscode.Range(0, 0, document.lineCount, 0),
				'# Roadmap\n\nShip it today.\n'
			)
			await vscode.workspace.applyEdit(dirty)

			const posted = spyOnPostedMessages(panel)
			await document.save()

			assert.strictEqual(
				messagesOfType(posted, 'requestLatest').length,
				1,
				'saving should have asked the panel for its current text exactly once'
			)
			assert.strictEqual(
				await fs.readFile(file.fsPath, 'utf8'),
				'# Roadmap\n\nShip it today.\n'
			)
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	/** The one signal the webview has for "the `TextDocument` is clean again" -
	 *  every panel showing the document has to hear it, not just whichever one
	 *  answered `requestLatest`. */
	test('tells the panel the document was saved', async function () {
		this.timeout(30_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(file.fsPath, '# Roadmap\n\nShip it.\n')

		const panel = await openNote(file)

		try {
			const document = await vscode.workspace.openTextDocument(file)
			const dirty = new vscode.WorkspaceEdit()
			dirty.replace(
				document.uri,
				new vscode.Range(0, 0, document.lineCount, 0),
				'# Roadmap\n\nShip it today.\n'
			)
			await vscode.workspace.applyEdit(dirty)

			const posted = spyOnPostedMessages(panel)
			await document.save()

			assert.strictEqual(
				messagesOfType(posted, 'documentSaved').length,
				1,
				'the panel should have been told the document was saved exactly once'
			)
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	/**
	 * A document can be saved (Save All, a script, another extension) without
	 * its custom editor ever having been opened - the participant must not
	 * hang or throw when it has no panel to ask.
	 */
	test('does not block a save when no panel is open for the document', async function () {
		this.timeout(30_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(file.fsPath, '# Roadmap\n\nShip it.\n')

		try {
			const document = await vscode.workspace.openTextDocument(file)
			const edit = new vscode.WorkspaceEdit()
			edit.replace(
				document.uri,
				new vscode.Range(0, 0, document.lineCount, 0),
				'# Roadmap\n\nShip it today.\n'
			)
			await vscode.workspace.applyEdit(edit)

			const saved = await document.save()

			assert.strictEqual(saved, true)
			assert.strictEqual(
				await fs.readFile(file.fsPath, 'utf8'),
				'# Roadmap\n\nShip it today.\n'
			)
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
