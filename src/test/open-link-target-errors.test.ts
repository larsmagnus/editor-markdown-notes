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

suite('Opening a link with a bad or encoded target', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	teardown(async () => {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
	})

	test('shows an error and opens nothing for a target that does not exist', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-link-test-'))
		try {
			const source = vscode.Uri.file(path.join(directory, 'source.md'))
			await fs.writeFile(source.fsPath, '# Source\n')
			const document = await vscode.workspace.openTextDocument(source)

			await openTestLink('./missing.md', document, createLinkDeps())

			assert.strictEqual(
				vscode.window.tabGroups.activeTabGroup.activeTab,
				undefined,
				'nothing should open for a target that does not exist'
			)
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('opens a target whose path is URL-encoded', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-link-test-'))
		try {
			const source = vscode.Uri.file(path.join(directory, 'source.md'))
			const target = vscode.Uri.file(path.join(directory, 'my notes.md'))
			await fs.writeFile(source.fsPath, '# Source\n')
			await fs.writeFile(target.fsPath, '# Target\n')
			const document = await vscode.workspace.openTextDocument(source)

			await openTestLink('./my%20notes.md', document, createLinkDeps())
			const tab = await waitForActiveTab(isCustomEditorTab)

			assert.ok(tab, 'the URL-encoded target should open')
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
