import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'
const VIEW_TYPE = 'editor-markdown-notes.markdownEditor'

/** Opening an editor is asynchronous; give the tab a moment to appear. */
async function waitForActiveTab(predicate: (tab: vscode.Tab) => boolean) {
	for (let attempt = 0; attempt < 50; attempt++) {
		const tab = vscode.window.tabGroups.activeTabGroup.activeTab
		if (tab && predicate(tab)) return tab

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	return undefined
}

suite('Open in text editor', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('opens the same file in the built-in text editor, then returns to the live view', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(file.fsPath, '# Hello\n')

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			const customTab = await waitForActiveTab(
				(tab) =>
					tab.input instanceof vscode.TabInputCustom &&
					tab.input.viewType === VIEW_TYPE
			)
			assert.ok(customTab, 'the file should open with our custom editor')

			await vscode.commands.executeCommand(
				'editor-markdown-notes.openInTextEditor'
			)

			const textTab = await waitForActiveTab(
				(tab) => tab.input instanceof vscode.TabInputText
			)
			assert.ok(textTab, 'the file should reopen in the built-in text editor')
			assert.ok(textTab.input instanceof vscode.TabInputText)
			assert.strictEqual(
				textTab.input.uri.fsPath,
				file.fsPath,
				'the text editor should open the same file'
			)

			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			const returnedTab = await waitForActiveTab(
				(tab) =>
					tab.input instanceof vscode.TabInputCustom &&
					tab.input.viewType === VIEW_TYPE
			)
			assert.ok(
				returnedTab,
				'reopening with the extension should return to the live editor'
			)
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
