import { describe, expect, it } from 'vitest'

import {
	imageMarkdownText,
	parseImageMarkdown,
} from '@/editor/extensions/image/image-markdown-text'

describe('imageMarkdownText', () => {
	it('builds markdown with no title', () => {
		expect(
			imageMarkdownText({ src: './diagram.png', alt: 'Diagram', title: null })
		).toBe('![Diagram](./diagram.png)')
	})

	it('builds markdown with a title', () => {
		expect(
			imageMarkdownText({
				src: './diagram.png',
				alt: 'Diagram',
				title: 'Architecture',
			})
		).toBe('![Diagram](./diagram.png "Architecture")')
	})

	it('escapes parentheses in the src', () => {
		expect(imageMarkdownText({ src: './a(1).png', alt: '', title: null })).toBe(
			'![](./a\\(1\\).png)'
		)
	})

	it('escapes quotes in the title', () => {
		expect(
			imageMarkdownText({ src: './a.png', alt: '', title: 'A "great" shot' })
		).toBe('![](./a.png "A \\"great\\" shot")')
	})
})

describe('parseImageMarkdown', () => {
	it('parses markdown with no title', () => {
		expect(parseImageMarkdown('![Diagram](./diagram.png)')).toEqual({
			src: './diagram.png',
			alt: 'Diagram',
			title: null,
		})
	})

	it('parses markdown with a title', () => {
		expect(
			parseImageMarkdown('![Diagram](./diagram.png "Architecture")')
		).toEqual({ src: './diagram.png', alt: 'Diagram', title: 'Architecture' })
	})

	it('unescapes parentheses in the src', () => {
		expect(parseImageMarkdown('![](./a\\(1\\).png)')).toEqual({
			src: './a(1).png',
			alt: '',
			title: null,
		})
	})

	it('unescapes quotes in the title', () => {
		expect(parseImageMarkdown('![](./a.png "A \\"great\\" shot")')).toEqual({
			src: './a.png',
			alt: '',
			title: 'A "great" shot',
		})
	})

	it('tolerates leading/trailing whitespace', () => {
		expect(parseImageMarkdown('  ![alt](./a.png)  ')).toEqual({
			src: './a.png',
			alt: 'alt',
			title: null,
		})
	})

	it('returns null for text that is not valid image markdown', () => {
		expect(parseImageMarkdown('not an image')).toBeNull()
		expect(parseImageMarkdown('![broken](')).toBeNull()
	})

	it('round-trips through imageMarkdownText', () => {
		const attrs = { src: './a(1).png', alt: 'A photo', title: 'A "title"' }
		expect(parseImageMarkdown(imageMarkdownText(attrs))).toEqual(attrs)
	})
})
