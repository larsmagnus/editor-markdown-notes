import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { createDelimitedMarkRevealProvider } from '#src/editor/extensions/formatting/create-delimited-mark-reveal-provider'
import { fixedDelimiter } from '#src/editor/extensions/formatting/delimiter-spec'
import { linkDelimiterSpec } from '#src/editor/extensions/link/link-delimiter-spec'
import { createEditor } from '#src/test-utils/editor'

describe('createDelimitedMarkRevealProvider', () => {
	it('spans the whole run, with a marker token at each end', () => {
		const editor = createEditor('', { extensions: [StarterKit] })
		// "hello " is 6 chars (positions 1-7); "**world**" (bold) runs 7-16.
		editor.commands.setContent('<p>hello <strong>**world**</strong> there</p>')

		const [span] = createDelimitedMarkRevealProvider(
			'bold',
			fixedDelimiter('**')
		).collect(editor.state.doc)

		expect(span.containerFrom).toBe(7)
		expect(span.containerTo).toBe(16)
		expect(span.tokens).toEqual([
			{ role: 'marker', from: 7, to: 9 },
			{ role: 'marker', from: 14, to: 16 },
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

	it("decomposes a link's close delimiter into marker/url/title tokens via closeTokens", () => {
		const href = 'https://example.com'
		const editor = createEditor(`[docs](${href} "The docs") now.`)

		const [span] = createDelimitedMarkRevealProvider(
			'link',
			linkDelimiterSpec()
		).collect(editor.state.doc)

		const urlFrom = 8
		const urlTo = urlFrom + href.length
		const titleFrom = urlTo + 1 // the opening quote, one space past the url
		const titleTo = titleFrom + '"The docs"'.length
		expect(span.tokens).toEqual([
			{ role: 'marker', from: 1, to: 2 },
			{ role: 'marker', from: 6, to: 8 },
			{ role: 'url', from: urlFrom, to: urlTo },
			{ role: 'title', from: titleFrom, to: titleTo },
			{ role: 'marker', from: titleTo, to: titleTo + 1 },
		])
	})
})
