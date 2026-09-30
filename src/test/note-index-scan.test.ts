import * as assert from 'assert'

import * as vscode from 'vscode'

import { buildNoteIndex } from '#src/host/note-index'
import { NOTE_INDEX_LIMIT } from '#src/shared/messages'
import { findEntry, workspaceUri } from '#src/test/note-index-test-support'
import { EXTENSION_ID } from '#src/test/tab-test-support'

suite('Workspace note index', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('lists a workspace note with its frontmatter title and details', async () => {
		const { entries } = await buildNoteIndex(workspaceUri('README.md'))

		const note = findEntry(entries, 'public', 'notes.md')

		assert.ok(note, 'public/notes.md should be indexed')
		assert.strictEqual(note.title, 'Editor Markdown Notes — Feature Playground')
		assert.strictEqual(note.fileName, 'notes.md')
		assert.strictEqual(note.directory, 'public')
		assert.deepStrictEqual(note.tags, ['testing', 'markdown', 'editor'])
		assert.ok(note.modified && note.modified > 0, 'expected a modified time')
		assert.ok(note.words && note.words > 0, 'expected a word count')
	})

	test('lists every file type the editor opens, and nothing else', async () => {
		const { entries } = await buildNoteIndex(workspaceUri('README.md'))

		assert.ok(findEntry(entries, 'public', 'sample-b.markdown'))
		assert.ok(findEntry(entries, 'public', 'sample-c.mdown'))
		assert.ok(findEntry(entries, 'public', 'sample-d.mkd'))
		assert.ok(findEntry(entries, 'public', 'sample-e.mdx'))
		assert.ok(findEntry(entries, 'public', 'sample-f.txt'))
		assert.strictEqual(findEntry(entries, 'package.json'), undefined)
	})

	test('counts every note found, even past the ones it lists', async () => {
		const { entries, total } = await buildNoteIndex(workspaceUri('README.md'))

		assert.ok(entries.length <= NOTE_INDEX_LIMIT)
		assert.ok(total >= entries.length)
	})

	test('lists notes inside .claude', async () => {
		const { entries } = await buildNoteIndex(workspaceUri('README.md'))

		assert.ok(
			findEntry(entries, '.claude', 'rules', 'testing.md'),
			'.claude/rules/testing.md should be indexed'
		)
	})

	test('marks the note the index was opened from', async () => {
		const current = workspaceUri('public', 'other-note.md')

		const { entries } = await buildNoteIndex(current)

		const currentEntries = entries.filter((entry) => entry.current)
		assert.deepStrictEqual(
			currentEntries.map((entry) => entry.uri),
			[current.toString()]
		)
	})
})
