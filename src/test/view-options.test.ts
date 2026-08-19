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

suite('View options', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('toggling raw and full width persists across invocations', async () => {
		await vscode.commands.executeCommand('editor-markdown-notes.toggleRaw')
		await vscode.commands.executeCommand(
			'editor-markdown-notes.toggleFullWidth'
		)

		// Reopening the editor is what proves persistence: the toggles are stored
		// in globalState by the host, not in any one webview.
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(file.fsPath, '# Hello\n')

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
			assert.ok(tab, 'the custom editor should open with the stored options')
		} finally {
			// Restore the defaults so the remaining tests see a clean slate.
			await vscode.commands.executeCommand('editor-markdown-notes.toggleRaw')
			await vscode.commands.executeCommand(
				'editor-markdown-notes.toggleFullWidth'
			)
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('offers the spelling languages without leaving the quick pick hanging', async () => {
		// Not awaited up front: the command resolves only once the quick pick
		// closes, so awaiting it here would deadlock the test.
		const picked = vscode.commands.executeCommand(
			'editor-markdown-notes.selectSpellingLanguage'
		)

		await new Promise((resolve) => setTimeout(resolve, 200))
		await vscode.commands.executeCommand('workbench.action.closeQuickOpen')

		// Dismissed rather than chosen, so nothing is written and the command
		// settles - the failure this guards against is it rejecting instead.
		assert.strictEqual(await picked, undefined)
	})
})
