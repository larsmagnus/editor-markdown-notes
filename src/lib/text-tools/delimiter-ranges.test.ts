import { describe, expect, it } from 'vitest'

import {
	appendProseText,
	delimiterRanges,
} from '#src/lib/text-tools/delimiter-ranges'
import type { TextSlice } from '#src/lib/text-tools/delimiter-ranges'
import { createEditor } from '#src/test-utils/editor'

function buildDoc(markType: string, delimited: string) {
	const editor = createEditor({
		type: 'doc',
		content: [
			{
				type: 'paragraph',
				content: [
					{ type: 'text', text: 'before ' },
					{ type: 'text', marks: [{ type: markType }], text: delimited },
					{ type: 'text', text: ' after' },
				],
			},
		],
	})
	return editor.state.doc
}

describe('delimiterRanges', () => {
	it('finds the opening and closing ** fence of a bold run', () => {
		const doc = buildDoc('bold', '**truly**')
		// 'before ' is 7 characters; the paragraph's content starts at position 1.
		const runFrom = 1 + 'before '.length
		expect(delimiterRanges(doc)).toEqual([
			[runFrom, runFrom + 2],
			[runFrom + 9 - 2, runFrom + 9],
		])
	})

	it('finds the opening and closing ~~ fence of a strike run', () => {
		const doc = buildDoc('strike', '~~struck~~')
		const runFrom = 1 + 'before '.length
		expect(delimiterRanges(doc)).toEqual([
			[runFrom, runFrom + 2],
			[runFrom + 10 - 2, runFrom + 10],
		])
	})

	// Regression: `createEditor(content, { parseOnly: true })` parses a mark straight onto its
	// bare interior, with no delimiter text - `ensure-delimiters-plugin.ts`
	// only adds it on the next real transaction. Stripping the run's first/
	// last two characters unconditionally used to eat real interior text.
	it('leaves a run with no literal delimiter text alone', () => {
		const editor = createEditor('The **report** was written.', {
			parseOnly: true,
		})

		expect(delimiterRanges(editor.state.doc)).toEqual([])
	})

	it('finds the opening and closing markers of an italic run', () => {
		const doc = buildDoc('italic', '_truly_')
		const runFrom = 1 + 'before '.length
		expect(delimiterRanges(doc)).toEqual([
			[runFrom, runFrom + 1],
			[runFrom + 7 - 1, runFrom + 7],
		])
	})

	it('finds an asterisk-delimited italic run too', () => {
		const doc = buildDoc('italic', '*truly*')
		const runFrom = 1 + 'before '.length
		expect(delimiterRanges(doc)).toEqual([
			[runFrom, runFrom + 1],
			[runFrom + 7 - 1, runFrom + 7],
		])
	})

	it('ignores a run too short to hold both delimiters', () => {
		const editor = createEditor({
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', marks: [{ type: 'bold' }], text: '**' }],
				},
			],
		})

		expect(delimiterRanges(editor.state.doc)).toEqual([])
	})
})

describe('appendProseText', () => {
	it('skips characters inside the given exclusions', () => {
		const slices: TextSlice[] = []
		const result = appendProseText(
			'',
			'**truly**',
			10,
			[
				[10, 12],
				[17, 19],
			],
			{ index: 0 },
			slices
		)

		expect(result).toBe('truly')
		expect(slices).toEqual([{ offset: 0, length: 5, from: 12 }])
	})

	it('appends the whole run when no exclusion overlaps it', () => {
		const slices: TextSlice[] = []
		const result = appendProseText('', 'plain', 0, [], { index: 0 }, slices)

		expect(result).toBe('plain')
		expect(slices).toEqual([{ offset: 0, length: 5, from: 0 }])
	})
})
