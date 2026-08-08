import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as path from 'path'

import * as vscode from 'vscode'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

const MARKDOWN_IMAGE = /!\[[^\]]*\]\(([^)\s]+)\)/g

suite('Sample note images', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('every image in the sample notes points at a file that exists', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		assert.ok(workspaceRoot, 'the tests must run with the repo as a workspace')

		const contentDirectory = path.join(workspaceRoot, 'public')
		const notes = (await fs.readdir(contentDirectory)).filter((name) =>
			name.endsWith('.md')
		)
		assert.ok(notes.length > 0, 'there should be sample notes to check')

		const checked: string[] = []

		for (const note of notes) {
			const file = vscode.Uri.file(path.join(contentDirectory, note))
			const document = await vscode.workspace.openTextDocument(file)

			const sources = [...document.getText().matchAll(MARKDOWN_IMAGE)].map(
				([, src]) => src
			)
			assert.ok(sources.length > 0, `${note} should document an image`)
			checked.push(...sources)

			for (const src of sources) {
				const expected = src.startsWith('/')
					? path.join(workspaceRoot, src)
					: path.resolve(path.dirname(document.uri.fsPath), src)

				await assert.doesNotReject(
					fs.access(expected),
					`${note} points at ${src}, which resolves to ${expected} — no such file`
				)
			}
		}

		// The samples are the only end-to-end coverage of either branch, so losing
		// one to an edit should fail here rather than go unnoticed.
		assert.ok(
			checked.some((src) => src.startsWith('/')),
			'a sample note should document a workspace-root path'
		)
		assert.ok(
			checked.some((src) => !src.startsWith('/')),
			'a sample note should document a document-relative path'
		)
	})
})
