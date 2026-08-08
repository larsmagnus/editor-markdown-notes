import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as path from 'path'

import * as vscode from 'vscode'

import { getImageBaseUris } from '../extension/image-base-uris'
import { resolveImageSrc } from '../lib/resolve-image-src'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

const MARKDOWN_IMAGE = /!\[[^\]]*\]\(([^)\s]+)\)/g

suite('Sample note image URIs', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('every sample image resolves to the webview URI of its file', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		assert.ok(workspaceRoot, 'the tests must run with the repo as a workspace')

		const contentDirectory = path.join(workspaceRoot, 'public')
		const notes = (await fs.readdir(contentDirectory)).filter((name) =>
			name.endsWith('.md')
		)

		// A throwaway panel purely for its `Webview`: `asWebviewUri` is the piece
		// under test, and only a real webview has it.
		const panel = vscode.window.createWebviewPanel(
			'editor-markdown-notes.test',
			'Image resolution',
			vscode.ViewColumn.One,
			{ localResourceRoots: [] }
		)

		try {
			for (const note of notes) {
				const file = vscode.Uri.file(path.join(contentDirectory, note))
				const document = await vscode.workspace.openTextDocument(file)
				const baseUris = getImageBaseUris(panel.webview, document)

				const sources = [...document.getText().matchAll(MARKDOWN_IMAGE)].map(
					([, src]) => src
				)

				for (const src of sources) {
					// Derived independently of `resolveImageSrc`, so this does not just
					// restate the implementation.
					const expected: string = src.startsWith('/')
						? path.join(workspaceRoot, src)
						: path.resolve(path.dirname(document.uri.fsPath), src)

					// Compared as URLs: both sides normalise the `file+…` authority.
					assert.strictEqual(
						new URL(resolveImageSrc(src, baseUris)).toString(),
						new URL(
							panel.webview.asWebviewUri(vscode.Uri.file(expected)).toString()
						).toString(),
						`${note} should load ${src} from ${expected}`
					)
				}
			}
		} finally {
			panel.dispose()
		}
	})
})
