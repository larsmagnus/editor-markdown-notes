import type { Editor } from '@tiptap/core'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { loadNoteContent } from '#src/editor/load-note-content'
import { openNote } from '#src/test-utils/editor'
import { fuzzRuns } from '#src/test-utils/fuzz-runs'
import { markdownDocument } from '#src/test-utils/markdown-arbitraries'
import {
	adversarialCorpus,
	commonmarkExamples,
	gfmExamples,
} from '#src/test-utils/markdown-corpus'

type BlockSpan = { start: number; end: number }

/** Where each top-level block of the loaded note sits in its source. */
function blockSpans(editor: Editor): BlockSpan[] {
	const registry = editor.storage.blockSource.registry
	if (!registry) return []

	const spans: BlockSpan[] = []
	let offset = registry.leadingGap.length
	let id = registry.firstId
	while (id !== null) {
		const entry = registry.entries.get(id)
		if (!entry) break
		spans.push({ start: offset, end: offset + entry.text.length })
		offset += entry.text.length + entry.gapAfter.length
		id = entry.nextId
	}
	return spans
}

/** The first position inside top-level block `index` that text can be typed at. */
function firstTypingPosition(editor: Editor, index: number): number | null {
	let blockStart = 0
	for (let i = 0; i < index; i++)
		blockStart += editor.state.doc.child(i).nodeSize

	let found: number | null = null
	editor.state.doc.child(index).descendants((node, pos) => {
		if (found !== null) return false
		if (node.isTextblock) found = blockStart + 1 + pos + 1
		return found === null
	})
	if (found === null && editor.state.doc.child(index).isTextblock) {
		found = blockStart + 1
	}
	return found
}

/**
 * Types into each block of `markdown` in turn and checks the save changed
 * nothing outside that block and the blank lines around it.
 */
function expectEachEditStaysLocal(editor: Editor, markdown: string) {
	loadNoteContent(editor, markdown, {
		fileKind: 'markdown',
		addToHistory: false,
	})
	const spans = blockSpans(editor)

	spans.forEach((_span, index) => {
		loadNoteContent(editor, markdown, {
			fileKind: 'markdown',
			addToHistory: false,
		})
		const position = firstTypingPosition(editor, index)
		if (position === null) return

		editor.view.dispatch(editor.state.tr.insertText('Z', position))
		const saved = editor.storage.markdown.getMarkdown()

		const untouchedBefore = markdown.slice(0, spans[index - 1]?.end ?? 0)
		const untouchedAfter = markdown.slice(
			spans[index + 1]?.start ?? markdown.length
		)
		expect(
			saved.startsWith(untouchedBefore),
			`block ${index}: text before changed`
		).toBe(true)
		expect(
			saved.endsWith(untouchedAfter),
			`block ${index}: text after changed`
		).toBe(true)
	})
}

describe('editing one block of a note', () => {
	describe.each([
		['the adversarial corpus', adversarialCorpus()],
		['the CommonMark spec', commonmarkExamples()],
		['the GFM spec', gfmExamples()],
	])('from %s', (_corpus, samples) => {
		it.each(samples)('leaves the rest of $name untouched', ({ markdown }) => {
			expectEachEditStaysLocal(openNote(''), markdown)
		})
	})

	it('leaves the rest of any generated note untouched', () => {
		const editor = openNote('')
		fc.assert(
			fc.property(markdownDocument(), (markdown) => {
				expectEachEditStaysLocal(editor, markdown)
			}),
			{ numRuns: fuzzRuns(100) }
		)
	})
})
