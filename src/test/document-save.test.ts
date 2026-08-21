import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import { DocumentWriter } from '../host/document-updates'

async function openTempNote(contents: string) {
	const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
	const file = path.join(directory, 'notes.md')
	await fs.writeFile(file, contents)

	return vscode.workspace.openTextDocument(vscode.Uri.file(file))
}

suite('Saving a document', () => {
	test('writes the webview markdown to disk', async () => {
		const writer = new DocumentWriter()
		const document = await openTempNote('# Roadmap\n\nShip it.\n')

		await writer.save(document, '# Roadmap\n\nShip it. Today.\n')

		assert.strictEqual(
			await fs.readFile(document.fileName, 'utf8'),
			'# Roadmap\n\nShip it. Today.\n'
		)
	})

	/**
	 * The webview stops sending an empty document at the debounce, so this is the
	 * last place a cleared note can be dropped. The full-range replace has to
	 * truncate the file rather than leave the previous text behind.
	 */
	test('truncates the file when the note has been emptied', async () => {
		const writer = new DocumentWriter()
		const document = await openTempNote('# Roadmap\n\nShip it.\n')

		await writer.save(document, '')

		assert.strictEqual(await fs.readFile(document.fileName, 'utf8'), '')
	})

	test('keeps frontmatter that outlived an emptied body', async () => {
		const writer = new DocumentWriter()
		const document = await openTempNote(
			'---\ntitle: Roadmap\n---\n\nShip it.\n'
		)

		await writer.save(document, '---\ntitle: Roadmap\n---\n\n')

		assert.strictEqual(
			await fs.readFile(document.fileName, 'utf8'),
			'---\ntitle: Roadmap\n---\n\n'
		)
	})

	// The edit fires `onDidChangeTextDocument`, which would push the text back at
	// the webview mid-keystroke; `isWriting` is what the listener checks to break
	// that loop, and it has to outlive the change events the edit produced.
	test('reports that it is writing until the change events have settled', async () => {
		const writer = new DocumentWriter()
		const document = await openTempNote('# Roadmap\n')

		assert.strictEqual(writer.isWriting, false)

		await writer.save(document, '# Roadmap 2026\n')
		assert.strictEqual(writer.isWriting, true)

		await new Promise((resolve) => setTimeout(resolve, 200))
		assert.strictEqual(writer.isWriting, false)
	})
})
