import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { findMarkRuns } from '#src/editor/extensions/formatting/find-mark-runs'
import { uniformOuterMarks } from '#src/editor/extensions/formatting/uniform-outer-marks'
import { createEditor } from '#src/test-utils/editor'

describe('uniformOuterMarks', () => {
	it('returns the outer mark when it covers the whole run', () => {
		const editor = createEditor(
			'<p><strong><em>bold and italic</em></strong></p>',
			{ extensions: [StarterKit] }
		)

		const [run] = findMarkRuns(editor.state.doc, editor.schema.marks.italic)
		const outer = uniformOuterMarks(editor.state.doc, run, ['bold'])

		expect(outer).toHaveLength(1)
		expect(outer[0].type.name).toBe('bold')
	})

	it('returns nothing when the outer mark is absent', () => {
		const editor = createEditor('<p><em>just italic</em></p>', {
			extensions: [StarterKit],
		})

		const [run] = findMarkRuns(editor.state.doc, editor.schema.marks.italic)
		const outer = uniformOuterMarks(editor.state.doc, run, ['bold'])

		expect(outer).toEqual([])
	})

	it('returns nothing when the outer mark only covers part of the run', () => {
		const editor = createEditor(
			'<p><em><strong>bold</strong> not bold</em></p>',
			{ extensions: [StarterKit] }
		)

		const [run] = findMarkRuns(editor.state.doc, editor.schema.marks.italic)
		const outer = uniformOuterMarks(editor.state.doc, run, ['bold'])

		expect(outer).toEqual([])
	})

	it('ignores an outer mark name absent from the schema', () => {
		const editor = createEditor('<p><em>just italic</em></p>', {
			extensions: [StarterKit],
		})

		const [run] = findMarkRuns(editor.state.doc, editor.schema.marks.italic)
		const outer = uniformOuterMarks(editor.state.doc, run, ['notAMark'])

		expect(outer).toEqual([])
	})
})
