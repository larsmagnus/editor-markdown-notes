import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { createEditor } from '@/test-utils/editor'

describe('findMarkRuns', () => {
	it('finds a single run', () => {
		const editor = createEditor('<p>hello <strong>world</strong> there</p>', {
			extensions: [StarterKit],
		})

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.bold)

		expect(runs).toHaveLength(1)
		expect(editor.state.doc.textBetween(runs[0].from, runs[0].to)).toBe('world')
	})

	it('finds multiple separate runs', () => {
		const editor = createEditor(
			'<p><strong>one</strong> plain <strong>two</strong></p>',
			{ extensions: [StarterKit] }
		)

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.bold)

		expect(runs).toHaveLength(2)
		expect(editor.state.doc.textBetween(runs[0].from, runs[0].to)).toBe('one')
		expect(editor.state.doc.textBetween(runs[1].from, runs[1].to)).toBe('two')
	})

	it('merges adjacent text nodes carrying the same mark into one run', () => {
		const editor = createEditor('', { extensions: [StarterKit] })
		// Two adjacent bold text nodes, e.g. from an italic mark starting
		// mid-run: still one contiguous bold run.
		editor.commands.setContent('<p><strong>bo<em>ld</em>text</strong></p>')

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.bold)

		expect(runs).toHaveLength(1)
		expect(editor.state.doc.textBetween(runs[0].from, runs[0].to)).toBe(
			'boldtext'
		)
	})

	it('returns nothing when the mark is not used', () => {
		const editor = createEditor('<p>plain text</p>', {
			extensions: [StarterKit],
		})

		expect(findMarkRuns(editor.state.doc, editor.schema.marks.bold)).toEqual([])
	})

	it('does not merge runs across a block boundary', () => {
		const editor = createEditor(
			'<p><strong>one</strong></p><p><strong>two</strong></p>',
			{ extensions: [StarterKit] }
		)

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.bold)

		expect(runs).toHaveLength(2)
	})
})
