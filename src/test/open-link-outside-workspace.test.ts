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

suite('Opening a link target outside any workspace', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	teardown(async () => {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
	})

	test('opens a relative link between two files outside any workspace', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-link-test-'))
		try {
			const source = vscode.Uri.file(path.join(directory, 'source.md'))
			const target = vscode.Uri.file(path.join(directory, 'target.md'))
			await fs.writeFile(source.fsPath, '# Source\n')
			await fs.writeFile(target.fsPath, '# Target\n')
			const document = await vscode.workspace.openTextDocument(source)

			await openTestLink('./target.md', document, createLinkDeps())
			const tab = await waitForActiveTab(isCustomEditorTab)

			assert.ok(tab, 'the target should open even outside a workspace')
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('shows an error and opens nothing for a leading-slash link with no workspace folder', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-link-test-'))
		try {
			const source = vscode.Uri.file(path.join(directory, 'source.md'))
			await fs.writeFile(source.fsPath, '# Source\n')
			const document = await vscode.workspace.openTextDocument(source)

			await openTestLink('/notes.md', document, createLinkDeps())

			assert.strictEqual(
				vscode.window.tabGroups.activeTabGroup.activeTab,
				undefined,
				'nothing should open for an unresolvable link'
			)
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
