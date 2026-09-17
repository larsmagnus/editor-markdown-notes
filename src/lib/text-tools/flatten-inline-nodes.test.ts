import type { Paragraph, PhrasingContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { describe, expect, it } from 'vitest'

import { flattenInlineNodes } from '#src/lib/text-tools/flatten-inline-nodes'
import {
	GFM_MDAST_EXTENSIONS,
	GFM_MICROMARK_EXTENSION,
} from '#src/lib/text-tools/gfm-without-footnotes'
import { sourceOffsetAt } from '#src/lib/text-tools/source-offset'

function firstParagraphChildren(markdown: string): readonly PhrasingContent[] {
	const tree = fromMarkdown(markdown, {
		extensions: [GFM_MICROMARK_EXTENSION],
		mdastExtensions: [GFM_MDAST_EXTENSIONS],
	})
	return (tree.children[0] as Paragraph).children
}

describe('flattenInlineNodes', () => {
	it('keeps plain text and traces it back to its source range', () => {
		const markdown = 'The report was written.'
		const { text, slices } = flattenInlineNodes(
			firstParagraphChildren(markdown),
			markdown,
			0,
			0
		)

		expect(text).toBe(markdown)
		const start = text.indexOf('written')
		const from = sourceOffsetAt(slices, start)
		expect(from).not.toBeNull()
		expect(markdown.slice(from ?? 0, (from ?? 0) + 'written'.length)).toBe(
			'written'
		)
	})

	it('substitutes inline code with a single space', () => {
		const markdown = 'Real `code` here.'
		const { text } = flattenInlineNodes(
			firstParagraphChildren(markdown),
			markdown,
			0,
			0
		)

		expect(text).toBe('Real   here.')
	})

	it('substitutes an image with a single space', () => {
		const markdown = 'Look ![a cat](cat.png) here.'
		const { text } = flattenInlineNodes(
			firstParagraphChildren(markdown),
			markdown,
			0,
			0
		)

		expect(text).toBe('Look   here.')
	})

	it('substitutes a hard break with a newline', () => {
		const markdown = 'First line\\\nSecond line'
		const { text } = flattenInlineNodes(
			firstParagraphChildren(markdown),
			markdown,
			0,
			0
		)

		expect(text).toBe('First line\nSecond line')
	})

	it('descends into emphasis and strong, keeping their text as prose', () => {
		const markdown = 'This is **bold** and _italic_ text.'
		const { text, slices } = flattenInlineNodes(
			firstParagraphChildren(markdown),
			markdown,
			0,
			0
		)

		expect(text).toBe('This is bold and italic text.')
		const start = text.indexOf('bold')
		const from = sourceOffsetAt(slices, start)
		expect(from).not.toBeNull()
		expect(markdown.slice(from ?? 0, (from ?? 0) + 'bold'.length)).toBe('bold')
	})

	it('offsets its slices by startOffset, for text appended after other content', () => {
		const markdown = 'The report was written.'
		const prefix = 'Earlier prose. '
		const { slices } = flattenInlineNodes(
			firstParagraphChildren(markdown),
			markdown,
			0,
			prefix.length
		)

		const combinedText = prefix + markdown
		const start = combinedText.indexOf('written')
		const from = sourceOffsetAt(slices, start)
		expect(from).not.toBeNull()
		expect(markdown.slice(from ?? 0, (from ?? 0) + 'written'.length)).toBe(
			'written'
		)
	})
})
