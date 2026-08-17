import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as path from 'path'

import * as vscode from 'vscode'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

/**
 * The two demo notes that exist to document an image-resolution rule, named
 * rather than swept up by a scan of `public/*.md`: a note added for any other
 * reason has no image to check, and a scan reported that as a failure of the
 * rules these cover. Naming them also makes losing one to an edit fail here,
 * which a scan over whatever happens to be on disk cannot.
 *
 * The icon is deliberately duplicated between `public/` and the workspace root
 * - each is a different app's root, and each note documents one of them.
 */
suite('Sample note images', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('notes.md documents a document-relative image that exists', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		assert.ok(workspaceRoot, 'the tests must run with the repo as a workspace')

		const note = vscode.Uri.file(path.join(workspaceRoot, 'public', 'notes.md'))
		const document = await vscode.workspace.openTextDocument(note)

		assert.ok(
			document
				.getText()
				.includes(
					'![Editor Markdown Notes icon](./icon-editor-markdown-notes.png)'
				),
			'notes.md is the demo note for a document-relative image and should keep documenting one'
		)

		await assert.doesNotReject(
			fs.access(
				path.join(workspaceRoot, 'public', 'icon-editor-markdown-notes.png')
			),
			'a document-relative image resolves out of the note folder, so the copy in public/ is the one it needs'
		)
	})

	test('other-note.md documents a workspace-root image that exists', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		assert.ok(workspaceRoot, 'the tests must run with the repo as a workspace')

		const note = vscode.Uri.file(
			path.join(workspaceRoot, 'public', 'other-note.md')
		)
		const document = await vscode.workspace.openTextDocument(note)

		assert.ok(
			document
				.getText()
				.includes(
					'![Editor Markdown Notes icon](/icon-editor-markdown-notes.png)'
				),
			'other-note.md is the demo note for a workspace-root image and should keep documenting one'
		)

		await assert.doesNotReject(
			fs.access(path.join(workspaceRoot, 'icon-editor-markdown-notes.png')),
			'a root-absolute image resolves out of the workspace root, so the copy there is the one it needs'
		)
	})
})
