import { describe, expect, it } from 'vitest'

import { findMarkRuns } from '#src/editor/extensions/formatting/find-mark-runs'
import { italicDelimiterSpec } from '#src/editor/extensions/italic/italic-delimiter-spec'
import { createEditor } from '#src/test-utils/editor'

describe('italicDelimiterSpec', () => {
	it('detects either italic marker at the start of text', () => {
		const spec = italicDelimiterSpec()

		expect(spec.detectOpen('_text')).toBe(1)
		expect(spec.detectOpen('*text')).toBe(1)
		expect(spec.detectOpen('~text')).toBe(0)
	})

	it('detects either italic marker at the end of text', () => {
		const spec = italicDelimiterSpec()

		expect(spec.detectClose('text_')).toBe(1)
		expect(spec.detectClose('text*')).toBe(1)
		expect(spec.detectClose('text~')).toBe(0)
	})

	it('resolves to the underscore marker for an isolated run', () => {
		const editor = createEditor({
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							marks: [{ type: 'italic', attrs: { markup: '_' } }],
							text: 'truly',
						},
					],
				},
			],
		})

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.italic)
		expect(runs).toHaveLength(1)
		const spec = italicDelimiterSpec()

		expect(spec.resolveOpen(editor.state.doc, runs[0])).toBe('_')
		expect(spec.resolveClose(editor.state.doc, runs[0])).toBe('_')
	})

	it('falls back to an asterisk when the run sits mid-word', () => {
		const editor = createEditor({
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'hello' },
						{
							type: 'text',
							marks: [{ type: 'italic', attrs: { markup: '_' } }],
							text: 'world',
						},
					],
				},
			],
		})

		const runs = findMarkRuns(editor.state.doc, editor.schema.marks.italic)
		expect(runs).toHaveLength(1)
		const spec = italicDelimiterSpec()

		expect(spec.resolveOpen(editor.state.doc, runs[0])).toBe('*')
		expect(spec.resolveClose(editor.state.doc, runs[0])).toBe('*')
	})
})
