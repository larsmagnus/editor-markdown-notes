import { describe, expect, it } from 'vitest'

import {
	imageMarkdownSource,
	imageMarkdownText,
	parseImageMarkdown,
} from '#src/editor/extensions/image/image-markdown-text'

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

describe('imageMarkdownSource', () => {
	it('marks the path range as the text between the parens, with no title', () => {
		const { text, pathFrom, pathTo } = imageMarkdownSource({
			src: './diagram.png',
			alt: 'Diagram',
			title: null,
		})
		expect(text).toBe('![Diagram](./diagram.png)')
		expect(text.slice(pathFrom, pathTo)).toBe('./diagram.png')
	})

	it('marks the path range as covering the title too', () => {
		const { text, pathFrom, pathTo } = imageMarkdownSource({
			src: './diagram.png',
			alt: 'Diagram',
			title: 'Architecture',
		})
		expect(text).toBe('![Diagram](./diagram.png "Architecture")')
		expect(text.slice(pathFrom, pathTo)).toBe('./diagram.png "Architecture"')
	})

	it('marks the path range using the escaped src', () => {
		const { text, pathFrom, pathTo } = imageMarkdownSource({
			src: './a(1).png',
			alt: '',
			title: null,
		})
		expect(text).toBe('![](./a\\(1\\).png)')
		expect(text.slice(pathFrom, pathTo)).toBe('./a\\(1\\).png')
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
