import * as assert from 'assert'
import * as path from 'path'

import * as vscode from 'vscode'

import { getDocumentResourceRoots } from '../host/image-base-uris'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

/**
 * A webview refuses any file outside `localResourceRoots`, however correct the
 * `src` is - and it fails silently, as a broken image. One test per demo note,
 * so each image-resolution rule is covered by the roots its own note needs.
 */
suite('Sample note resource roots', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test("notes.md's image sits inside the roots the webview is given", async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		assert.ok(workspaceRoot, 'the tests must run with the repo as a workspace')

		const note = vscode.Uri.file(path.join(workspaceRoot, 'public', 'notes.md'))
		const document = await vscode.workspace.openTextDocument(note)
		const roots = getDocumentResourceRoots(document)
		const image = path.join(
			workspaceRoot,
			'public',
			'icon-editor-markdown-notes.png'
		)

		assert.ok(
			roots.some(
				(root) =>
					image === root.fsPath || image.startsWith(root.fsPath + path.sep)
			),
			`${image} is outside localResourceRoots, so the webview would refuse it`
		)
	})

	test("other-note.md's image sits inside the roots the webview is given", async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		assert.ok(workspaceRoot, 'the tests must run with the repo as a workspace')

		const note = vscode.Uri.file(
			path.join(workspaceRoot, 'public', 'other-note.md')
		)
		const document = await vscode.workspace.openTextDocument(note)
		const roots = getDocumentResourceRoots(document)
		const image = path.join(workspaceRoot, 'icon-editor-markdown-notes.png')

		assert.ok(
			roots.some(
				(root) =>
					image === root.fsPath || image.startsWith(root.fsPath + path.sep)
			),
			`${image} is outside localResourceRoots, so the webview would refuse it`
		)
	})
})
