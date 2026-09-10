import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import {
	createLinkDeps,
	EXTENSION_ID,
	isCustomEditorTab,
	openTestLink,
	waitForActiveTab,
} from '#src/test/link-test-support'

suite('Opening a link target', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	teardown(async () => {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
	})

	test('opens a relative markdown link with our custom editor, reusing a preview tab', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-link-test-'))
		try {
			const first = vscode.Uri.file(path.join(directory, 'first.md'))
			const second = vscode.Uri.file(path.join(directory, 'second.md'))
			await fs.writeFile(first.fsPath, '# First\n')
			await fs.writeFile(second.fsPath, '# Second\n')
			const source = await vscode.workspace.openTextDocument(first)
			const deps = createLinkDeps()

			await openTestLink('./first.md', source, deps)
			const firstTab = await waitForActiveTab(isCustomEditorTab)
			assert.ok(firstTab, 'the first link should open with our custom editor')
			assert.ok(
				firstTab.isPreview,
				'a link-opened tab should start in preview mode'
			)

			await openTestLink('./second.md', source, deps)
			const secondTab = await waitForActiveTab(
				(tab) =>
					isCustomEditorTab(tab) &&
					tab.input instanceof vscode.TabInputCustom &&
					tab.input.uri.fsPath === second.fsPath
			)
			assert.ok(secondTab, 'the second link should open with our custom editor')

			assert.strictEqual(
				vscode.window.tabGroups.all.flatMap((group) => group.tabs).length,
				1,
				"the second link should reuse the first link's preview tab, not add one"
			)
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
