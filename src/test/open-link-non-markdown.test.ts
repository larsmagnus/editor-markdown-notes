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

suite('Opening a non-markdown link target', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	teardown(async () => {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
	})

	test('opens a non-markdown relative link with vscode.open, not our custom editor', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-link-test-'))
		try {
			const source = vscode.Uri.file(path.join(directory, 'source.md'))
			const target = vscode.Uri.file(path.join(directory, 'notes.json'))
			await fs.writeFile(source.fsPath, '# Source\n')
			await fs.writeFile(target.fsPath, '{}\n')
			const document = await vscode.workspace.openTextDocument(source)

			await openTestLink('./notes.json', document, createLinkDeps())
			const tab = await waitForActiveTab(
				(tab) =>
					tab.input instanceof vscode.TabInputText &&
					tab.input.uri.fsPath === target.fsPath
			)

			assert.ok(tab, 'the non-markdown target should open')
			assert.ok(
				!isCustomEditorTab(tab),
				'it should not open with our custom editor'
			)
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
