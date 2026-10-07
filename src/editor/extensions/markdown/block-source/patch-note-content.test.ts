import type { Editor } from '@tiptap/core'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { patchNoteContent } from '#src/editor/extensions/markdown/block-source/patch-note-content'
import { recordSyncedNote } from '#src/editor/extensions/markdown/block-source/synced-blocks'
import { loadNoteContent } from '#src/editor/load-note-content'
import { openNote } from '#src/test-utils/editor'
import { fuzzRuns } from '#src/test-utils/fuzz-runs'
import { markdownDocument } from '#src/test-utils/markdown-arbitraries'

/** Types `text` at the end of top-level block `index`, caret and all, as the author would. */
function typeAtEndOf(editor: Editor, index: number, text: string) {
	let end = 0
	for (let i = 0; i <= index; i++) end += editor.state.doc.child(i).nodeSize
	editor.commands.setTextSelection(end - 1)
	editor.view.dispatch(editor.state.tr.insertText(text))
}

describe('patchNoteContent', () => {
	it('replaces only the block an outside change touched', () => {
		const editor = openNote('# Roadmap\n\nShip it.\n\nDone.\n')
		const [heading, , done] = editor.state.doc.content.content

		patchNoteContent(
			editor,
			'# Roadmap\n\nShip it today.\n\nDone.\n',
			'markdown'
		)

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'# Roadmap\n\nShip it today.\n\nDone.\n'
		)
		expect(editor.state.doc.child(0)).toBe(heading)
		expect(editor.state.doc.child(2)).toBe(done)
	})

	it('leaves the caret where it was when another block changes', () => {
		const editor = openNote('# Roadmap\n\nShip it.\n\nDone.\n')
		typeAtEndOf(editor, 1, ' Today')
		const caret = editor.state.selection.from

		patchNoteContent(
			editor,
			'# Roadmap\n\nShip it.\n\nDone and dusted.\n',
			'markdown'
		)

		expect(editor.state.selection.from).toBe(caret)
	})

	it('takes an outside change elsewhere while keeping what the author is typing', () => {
		const editor = openNote('# Roadmap\n\nShip it.\n\nDone.\n')
		typeAtEndOf(editor, 1, ' Today')

		patchNoteContent(
			editor,
			'# Roadmap 2026\n\nShip it.\n\nDone.\n',
			'markdown'
		)

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'# Roadmap 2026\n\nShip it. Today\n\nDone.\n'
		)
	})

	it("keeps the author's version of a block an outside change also touched", () => {
		const editor = openNote('# Roadmap\n\nShip it.\n\nDone.\n')
		typeAtEndOf(editor, 1, ' Today')

		patchNoteContent(
			editor,
			'# Roadmap\n\nShip it next week.\n\nDone.\n',
			'markdown'
		)

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'# Roadmap\n\nShip it. Today\n\nDone.\n'
		)
	})

	it('takes an outside change to a block once the author has synced their edit to it', () => {
		const editor = openNote('# Roadmap\n\nShip it.\n\nDone.\n')
		typeAtEndOf(editor, 1, ' Today')
		recordSyncedNote(editor, editor.storage.markdown.getMarkdown())

		patchNoteContent(
			editor,
			'# Roadmap\n\nShip it next week.\n\nDone.\n',
			'markdown'
		)

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'# Roadmap\n\nShip it next week.\n\nDone.\n'
		)
	})

	it('keeps blank lines the author typed through an outside change elsewhere', () => {
		const editor = openNote('# Roadmap\n\nShip it.\n')
		editor.commands.setTextSelection(editor.state.doc.child(0).nodeSize - 1)
		editor.commands.splitBlock()
		editor.commands.splitBlock()

		patchNoteContent(editor, '# Roadmap\n\nShip it today.\n', 'markdown')

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'# Roadmap\n\n\n\nShip it today.\n'
		)
	})

	it('ends up holding exactly the incoming note when the author changed nothing', () => {
		const editor = openNote('')
		fc.assert(
			fc.property(markdownDocument(), markdownDocument(), (before, after) => {
				loadNoteContent(editor, before, {
					fileKind: 'markdown',
					addToHistory: false,
				})

				patchNoteContent(editor, after, 'markdown')

				expect(editor.storage.markdown.getMarkdown()).toBe(after)
			}),
			{ numRuns: fuzzRuns(100) }
		)
	})

	it('never loses what the author typed, whatever the outside change', () => {
		const editor = openNote('')
		const notes = markdownDocument().filter((note) => note.trim() !== '')
		fc.assert(
			fc.property(
				notes,
				markdownDocument(),
				fc.nat(),
				(before, after, pick) => {
					loadNoteContent(editor, before, {
						fileKind: 'markdown',
						addToHistory: false,
					})
					typeAtEndOf(editor, pick % editor.state.doc.childCount, 'Z')

					patchNoteContent(editor, after, 'markdown')

					expect(editor.storage.markdown.getMarkdown()).toContain('Z')
				}
			),
			{ numRuns: fuzzRuns(100) }
		)
	})
})
