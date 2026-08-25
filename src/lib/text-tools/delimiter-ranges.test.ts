import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import {
	appendProseText,
	delimiterRanges,
} from '@/lib/text-tools/delimiter-ranges'
import type { TextSlice } from '@/lib/text-tools/delimiter-ranges'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

function buildDoc(markType: string, delimited: string) {
	const editor = new Editor({ extensions, content: '' })
	currentEditor = editor
	editor.commands.setContent({
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

	// Regression: `new Editor({ content })` parses a mark straight onto its
	// bare interior, with no delimiter text - `ensure-delimiters-plugin.ts`
	// only adds it on the next real transaction. Stripping the run's first/
	// last two characters unconditionally used to eat real interior text.
	it('leaves a run with no literal delimiter text alone', () => {
		const editor = new Editor({
			extensions,
			content: 'The **report** was written.',
		})
		currentEditor = editor

		expect(delimiterRanges(editor.state.doc)).toEqual([])
	})

	it('ignores a run too short to hold both delimiters', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		editor.commands.setContent({
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
