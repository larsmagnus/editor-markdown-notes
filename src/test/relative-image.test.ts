import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import { getImageBaseUris } from '../host/image-base-uris'
import { resolveImageSrc } from '../lib/host/resolve-image-src'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

/** A 1x1 transparent PNG, so the image on disk is a real one. */
const PIXEL_PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
	'base64'
)

/**
 * A throwaway panel purely for its `Webview`. `asWebviewUri` is the piece under
 * test and only a real webview has it.
 */
async function withWebview<T>(run: (webview: vscode.Webview) => Promise<T>) {
	const panel = vscode.window.createWebviewPanel(
		'editor-markdown-notes.test',
		'Image resolution',
		vscode.ViewColumn.One,
		{ localResourceRoots: [] }
	)

	try {
		return await run(panel.webview)
	} finally {
		panel.dispose()
	}
}

/** URLs compared as URLs: both sides normalise the `file+…` webview authority. */
function assertSameUrl(actual: string, expected: string, message: string) {
	assert.strictEqual(
		new URL(actual).toString(),
		new URL(expected).toString(),
		message
	)
}

suite('Document-relative images', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('a document-relative image resolves out of the document folder', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const documentFile = path.join(directory, 'docs', 'notes.md')
		const imageFile = path.join(directory, 'assets', 'diagram.png')

		await fs.mkdir(path.dirname(documentFile))
		await fs.mkdir(path.dirname(imageFile))
		await fs.writeFile(documentFile, '![Architecture](../assets/diagram.png)\n')
		await fs.writeFile(imageFile, PIXEL_PNG)

		try {
			const document = await vscode.workspace.openTextDocument(
				vscode.Uri.file(documentFile)
			)

			await withWebview(async (webview) => {
				// The temp file sits outside the workspace, so `getImageBaseUris`
				// falls the workspace base back to the document folder. Only the
				// relative branch is meaningful here.
				const baseUris = getImageBaseUris(webview, document)

				assertSameUrl(
					resolveImageSrc('../assets/diagram.png', baseUris),
					webview.asWebviewUri(vscode.Uri.file(imageFile)).toString(),
					'the image should load from the sibling assets folder'
				)
			})
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
