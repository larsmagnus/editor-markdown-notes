import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'

describe('findMarkRuns', () => {
	it('finds a single run', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>hello <strong>world</strong> there</p>')

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.bold)

		expect(runs).toHaveLength(1)
		expect(editor.state.doc.textBetween(runs[0].from, runs[0].to)).toBe('world')
	})

	it('finds multiple separate runs', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent(
			'<p><strong>one</strong> plain <strong>two</strong></p>'
		)

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.bold)

		expect(runs).toHaveLength(2)
		expect(editor.state.doc.textBetween(runs[0].from, runs[0].to)).toBe('one')
		expect(editor.state.doc.textBetween(runs[1].from, runs[1].to)).toBe('two')
	})

	it('merges adjacent text nodes carrying the same mark into one run', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
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
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent('<p>plain text</p>')

		expect(findMarkRuns(editor.state.doc, editor.schema.marks.bold)).toEqual([])
	})

	it('does not merge runs across a block boundary', () => {
		const editor = new Editor({ extensions: [StarterKit], content: '' })
		editor.commands.setContent(
			'<p><strong>one</strong></p><p><strong>two</strong></p>'
		)

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.bold)

		expect(runs).toHaveLength(2)
	})
})
