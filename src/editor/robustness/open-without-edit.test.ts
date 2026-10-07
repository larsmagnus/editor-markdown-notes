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

/**
 * Opening a note must never change it. Whatever the editor cannot represent
 * faithfully is shown as written, so the file is byte-identical until the
 * author edits it - and even then, only where they edited.
 */
describe('opening a note without editing it', () => {
	describe.each([
		['the adversarial corpus', adversarialCorpus()],
		['the CommonMark spec', commonmarkExamples()],
		['the GFM spec', gfmExamples()],
	])('from %s', (_corpus, samples) => {
		it.each(samples)('saves $name back byte for byte', ({ markdown }) => {
			const editor = openNote(markdown)

			expect(editor.storage.markdown.getMarkdown()).toBe(markdown)
		})
	})

	// One editor for every case: thousands of them outlive a deep run's heap.
	it('saves any generated note back byte for byte', () => {
		const editor = openNote('')
		fc.assert(
			fc.property(markdownDocument(), (markdown) => {
				loadNoteContent(editor, markdown, {
					fileKind: 'markdown',
					addToHistory: false,
				})

				expect(editor.storage.markdown.getMarkdown()).toBe(markdown)
			}),
			{ numRuns: fuzzRuns(100) }
		)
	})
})
