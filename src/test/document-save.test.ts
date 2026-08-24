import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import { DocumentWriter } from '../host/document-updates'

const log = { info: () => {}, warn: () => {}, error: () => {} }

async function openTempNote(contents: string) {
	const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
	const file = path.join(directory, 'notes.md')
	await fs.writeFile(file, contents)

	return vscode.workspace.openTextDocument(vscode.Uri.file(file))
}

suite('Syncing a document', () => {
	test('applies the webview markdown to the document without writing to disk', async () => {
		const writer = new DocumentWriter(log)
		const document = await openTempNote('# Roadmap\n\nShip it.\n')

		await writer.write(document, '# Roadmap\n\nShip it. Today.\n')

		assert.strictEqual(document.getText(), '# Roadmap\n\nShip it. Today.\n')
		assert.strictEqual(document.isDirty, true)
		assert.strictEqual(
			await fs.readFile(document.fileName, 'utf8'),
			'# Roadmap\n\nShip it.\n'
		)
	})

	test('reaches disk, and clears the dirty flag, once VS Code saves the document', async () => {
		const writer = new DocumentWriter(log)
		const document = await openTempNote('# Roadmap\n\nShip it.\n')

		await writer.write(document, '# Roadmap\n\nShip it. Today.\n')
		await document.save()

		assert.strictEqual(document.isDirty, false)
		assert.strictEqual(
			await fs.readFile(document.fileName, 'utf8'),
			'# Roadmap\n\nShip it. Today.\n'
		)
	})

	/**
	 * The webview stops sending an empty document at the debounce, so this is the
	 * last place a cleared note can be dropped. The minimal-diff replace has to
	 * truncate the document rather than leave the previous text behind.
	 */
	test('truncates the document when the note has been emptied', async () => {
		const writer = new DocumentWriter(log)
		const document = await openTempNote('# Roadmap\n\nShip it.\n')

		await writer.write(document, '')

		assert.strictEqual(document.getText(), '')
	})

	test('keeps frontmatter that outlived an emptied body', async () => {
		const writer = new DocumentWriter(log)
		const document = await openTempNote(
			'---\ntitle: Roadmap\n---\n\nShip it.\n'
		)

		await writer.write(document, '---\ntitle: Roadmap\n---\n\n')

		assert.strictEqual(document.getText(), '---\ntitle: Roadmap\n---\n\n')
	})

	/**
	 * The edit fires `onDidChangeTextDocument`, which would push the text back
	 * at the webview mid-keystroke; `matchesLastWrite` is what the change
	 * subscription checks to break that loop.
	 */
	test('recognises its own write as the last one applied', async () => {
		const writer = new DocumentWriter(log)
		const document = await openTempNote('# Roadmap\n')

		assert.strictEqual(writer.matchesLastWrite('# Roadmap 2026\n'), false)

		await writer.write(document, '# Roadmap 2026\n')

		assert.strictEqual(writer.matchesLastWrite('# Roadmap 2026\n'), true)
	})

	test('recognises a change worth telling the webview about, after its own write', async () => {
		const writer = new DocumentWriter(log)
		const document = await openTempNote('# Roadmap\n')

		await writer.write(document, '# Roadmap 2026\n')

		const edit = new vscode.WorkspaceEdit()
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			'# Something else entirely\n'
		)
		await vscode.workspace.applyEdit(edit)

		// `document-change-subscription.ts` calls `matchesLastWrite` with the
		// document's *current* text, not the text it last wrote - that's the
		// distinction this test exists to pin.
		assert.strictEqual(writer.matchesLastWrite(document.getText()), false)
	})

	/**
	 * Pins the minimal-diff decision (`minimal-edit.ts`): once the document
	 * stays dirty between syncs rather than being saved on every one, a
	 * full-range replace would turn every keystroke into a new entry on VS
	 * Code's own text undo stack.
	 */
	test('edits only the part of the document that changed', async () => {
		const writer = new DocumentWriter(log)
		const original = '# Roadmap\n\nShip it today, not next week.\n\nDone.\n'
		const document = await openTempNote(original)

		const changes: vscode.TextDocumentContentChangeEvent[] = []
		const subscription = vscode.workspace.onDidChangeTextDocument((event) => {
			if (event.document.uri.toString() !== document.uri.toString()) return
			changes.push(...event.contentChanges)
		})

		try {
			await writer.write(
				document,
				'# Roadmap\n\nShip it tomorrow, not next week.\n\nDone.\n'
			)

			assert.strictEqual(changes.length, 1)
			assert.ok(
				changes[0].rangeLength < 10,
				`expected a small edit, got a range of ${changes[0].rangeLength} characters in a ${original.length}-character document`
			)
		} finally {
			subscription.dispose()
		}
	})
})
