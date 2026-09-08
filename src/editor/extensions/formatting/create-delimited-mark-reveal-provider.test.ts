import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { createDelimitedMarkRevealProvider } from '#src/editor/extensions/formatting/create-delimited-mark-reveal-provider'
import { fixedDelimiter } from '#src/editor/extensions/formatting/delimiter-spec'
import { createEditor } from '#src/test-utils/editor'

describe('createDelimitedMarkRevealProvider', () => {
	it('spans the whole run, with delimiter ranges at each end', () => {
		const editor = createEditor('', { extensions: [StarterKit] })
		// "hello " is 6 chars (positions 1-7); "**world**" (bold) runs 7-16.
		editor.commands.setContent('<p>hello <strong>**world**</strong> there</p>')

		const [span] = createDelimitedMarkRevealProvider(
			'bold',
			fixedDelimiter('**')
		).collect(editor.state.doc)

		expect(span.containerFrom).toBe(7)
		expect(span.containerTo).toBe(16)
		expect(span.syntaxRanges).toEqual([
			[7, 9],
			[14, 16],
		])
	})

	it('returns one span per separate run', () => {
		const editor = createEditor(
			'<p><strong>**one**</strong> plain <strong>**two**</strong></p>',
			{ extensions: [StarterKit] }
		)

		const spans = createDelimitedMarkRevealProvider(
			'bold',
			fixedDelimiter('**')
		).collect(editor.state.doc)

		expect(spans).toHaveLength(2)
	})

	it('skips a run too short to contain both delimiters', () => {
		const editor = createEditor('<p><strong>*</strong></p>', {
			extensions: [StarterKit],
		})

		expect(
			createDelimitedMarkRevealProvider('bold', fixedDelimiter('**')).collect(
				editor.state.doc
			)
		).toEqual([])
	})

	it('returns nothing when the mark type does not exist in the schema', () => {
		const editor = createEditor('<p>hello</p>', { extensions: [StarterKit] })

		expect(
			createDelimitedMarkRevealProvider(
				'notARealMark',
				fixedDelimiter('**')
			).collect(editor.state.doc)
		).toEqual([])
	})
})
