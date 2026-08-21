import * as assert from 'assert'
import * as path from 'path'

import * as vscode from 'vscode'

import { getImageBaseUris } from '../host/image-base-uris'
import { resolveImageSrc } from '../lib/host/resolve-image-src'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

/**
 * One test per image-resolution rule, against the demo note that documents it -
 * the two branches of `resolveImageSrc`, end to end through a real webview's
 * `asWebviewUri`, which is the piece a unit test cannot reach.
 */
suite('Sample note image URIs', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('notes.md loads its image out of the note folder', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		assert.ok(workspaceRoot, 'the tests must run with the repo as a workspace')

		const note = vscode.Uri.file(path.join(workspaceRoot, 'public', 'notes.md'))
		const document = await vscode.workspace.openTextDocument(note)

		// A throwaway panel purely for its `Webview`: `asWebviewUri` is the piece
		// under test, and only a real webview has it.
		const panel = vscode.window.createWebviewPanel(
			'editor-markdown-notes.test',
			'Image resolution',
			vscode.ViewColumn.One,
			{ localResourceRoots: [] }
		)

		try {
			const resolved = resolveImageSrc(
				'./icon-editor-markdown-notes.png',
				getImageBaseUris(panel.webview, document)
			)
			const expected = panel.webview.asWebviewUri(
				vscode.Uri.file(
					path.join(workspaceRoot, 'public', 'icon-editor-markdown-notes.png')
				)
			)

			// Compared as URLs: both sides normalise the `file+…` authority.
			assert.strictEqual(
				new URL(resolved).toString(),
				new URL(expected.toString()).toString()
			)
		} finally {
			panel.dispose()
		}
	})

	test('other-note.md loads its image out of the workspace root', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		assert.ok(workspaceRoot, 'the tests must run with the repo as a workspace')

		const note = vscode.Uri.file(
			path.join(workspaceRoot, 'public', 'other-note.md')
		)
		const document = await vscode.workspace.openTextDocument(note)

		const panel = vscode.window.createWebviewPanel(
			'editor-markdown-notes.test',
			'Image resolution',
			vscode.ViewColumn.One,
			{ localResourceRoots: [] }
		)

		try {
			const resolved = resolveImageSrc(
				'/icon-editor-markdown-notes.png',
				getImageBaseUris(panel.webview, document)
			)
			const expected = panel.webview.asWebviewUri(
				vscode.Uri.file(
					path.join(workspaceRoot, 'icon-editor-markdown-notes.png')
				)
			)

			assert.strictEqual(
				new URL(resolved).toString(),
				new URL(expected.toString()).toString()
			)
		} finally {
			panel.dispose()
		}
	})
})
