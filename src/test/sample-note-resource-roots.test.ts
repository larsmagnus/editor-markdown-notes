import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as path from 'path'

import * as vscode from 'vscode'

import { getDocumentResourceRoots } from '../extension/image-base-uris'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

const MARKDOWN_IMAGE = /!\[[^\]]*\]\(([^)\s]+)\)/g

suite('Sample note resource roots', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	/**
	 * A webview refuses any file outside `localResourceRoots`, however correct
	 * the `src` is - and it fails silently, as a broken image.
	 */
	test('every sample image sits inside the roots the webview is given', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		assert.ok(workspaceRoot, 'the tests must run with the repo as a workspace')

		const contentDirectory = path.join(workspaceRoot, 'public')
		const notes = (await fs.readdir(contentDirectory)).filter((name) =>
			name.endsWith('.md')
		)
		assert.ok(notes.length > 0, 'there should be sample notes to check')

		for (const note of notes) {
			const file = vscode.Uri.file(path.join(contentDirectory, note))
			const document = await vscode.workspace.openTextDocument(file)
			const roots = getDocumentResourceRoots(document)

			const sources = [...document.getText().matchAll(MARKDOWN_IMAGE)].map(
				([, src]) => src
			)

			for (const src of sources) {
				const expected = src.startsWith('/')
					? path.join(workspaceRoot, src)
					: path.resolve(path.dirname(document.uri.fsPath), src)

				assert.ok(
					roots.some(
						(root) =>
							expected === root.fsPath ||
							expected.startsWith(root.fsPath + path.sep)
					),
					`${expected} is outside localResourceRoots, so the webview would refuse it`
				)
			}
		}
	})
})
