import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'
const VIEW_TYPE = 'editor-markdown-notes.markdownEditor'

/** Opening a custom editor is asynchronous; give the tab a moment to appear. */
async function waitForActiveTab(predicate: (tab: vscode.Tab) => boolean) {
	for (let attempt = 0; attempt < 50; attempt++) {
		const tab = vscode.window.tabGroups.activeTabGroup.activeTab
		if (tab && predicate(tab)) return tab

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	return undefined
}

suite('Opening notes', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('rejects a file that is not markdown', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.txt'))
		await fs.writeFile(file.fsPath, 'not markdown\n')

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			const tab = vscode.window.tabGroups.activeTabGroup.activeTab
			assert.ok(
				!(
					tab?.input instanceof vscode.TabInputCustom &&
					tab.input.viewType === VIEW_TYPE
				),
				'a non-markdown file should not open in the custom editor'
			)
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('opens a markdown file containing a literal </script> tag', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		// Interpolated into an inline <script> as `window.initialContent`; without
		// escaping, this closes the block early and the webview loads blank.
		await fs.writeFile(file.fsPath, '# Docs\n\n`</script>`\n')

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			const tab = await waitForActiveTab(
				(tab) =>
					tab.input instanceof vscode.TabInputCustom &&
					tab.input.viewType === VIEW_TYPE
			)

			assert.ok(tab, 'the custom editor should still open')
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	// The webview has its own origin, so an image path only loads if the host
	// resolves it to a `vscode-resource` URI pointing at a file that exists
	// inside `localResourceRoots`. A path that resolves to nothing renders as a
	// broken image with no error anywhere — hence these tests.
	test('opens the active markdown file with the custom editor', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(file.fsPath, '# Hello\n')

		try {
			// Open in the default text editor first, so the command has to pick the
			// file up from the active editor rather than from an argument.
			const document = await vscode.workspace.openTextDocument(file)
			await vscode.window.showTextDocument(document)

			await vscode.commands.executeCommand('editor-markdown-notes.openFile')

			const tab = await waitForActiveTab(
				(tab) =>
					tab.input instanceof vscode.TabInputCustom &&
					tab.input.viewType === VIEW_TYPE
			)

			assert.ok(tab, 'the custom editor tab should become active')
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
