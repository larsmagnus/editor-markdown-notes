import * as assert from 'assert'

import * as vscode from 'vscode'

import { NOTE_INDEX_LIMIT } from '#src/shared/messages'
import {
	buildDefaultNoteIndex,
	findEntry,
	workspaceUri,
} from '#src/test/note-index-test-support'
import { EXTENSION_ID } from '#src/test/tab-test-support'

suite('Workspace note index', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('lists a workspace note with its frontmatter title and details', async () => {
		const { entries } = await buildDefaultNoteIndex()

		const note = findEntry(entries, 'public', 'notes.md')

		assert.ok(note, 'public/notes.md should be indexed')
		assert.strictEqual(note.title, 'punchdown — Feature Playground')
		assert.strictEqual(note.fileName, 'notes.md')
		assert.strictEqual(note.directory, 'public')
		assert.deepStrictEqual(note.tags, ['testing', 'markdown', 'editor'])
		assert.ok(note.modified && note.modified > 0, 'expected a modified time')
		assert.ok(note.words && note.words > 0, 'expected a word count')
	})

	test('lists every file type the editor opens, and nothing else', async () => {
		const { entries } = await buildDefaultNoteIndex()

		assert.ok(findEntry(entries, 'public', 'sample-b.markdown'))
		assert.ok(findEntry(entries, 'public', 'sample-c.mdown'))
		assert.ok(findEntry(entries, 'public', 'sample-d.mkd'))
		assert.ok(findEntry(entries, 'public', 'sample-e.mdx'))
		assert.ok(findEntry(entries, 'public', 'sample-f.txt'))
		assert.strictEqual(findEntry(entries, 'package.json'), undefined)
	})

	test('counts every note found, even past the ones it lists', async () => {
		const { entries, total } = await buildDefaultNoteIndex()

		assert.ok(entries.length <= NOTE_INDEX_LIMIT)
		assert.ok(total >= entries.length)
	})

	test('marks the note the index was opened from', async () => {
		const { entries } = await buildDefaultNoteIndex(
			workspaceUri('public', 'other-note.md')
		)

		assert.deepStrictEqual(
			entries.filter((entry) => entry.current).map((entry) => entry.fileName),
			['other-note.md']
		)
	})
})
