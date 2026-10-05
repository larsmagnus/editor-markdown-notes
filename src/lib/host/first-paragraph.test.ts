import { describe, expect, it } from 'vitest'

import { firstParagraph } from '#src/lib/host/first-paragraph'

describe('firstParagraph', () => {
	it('reads the paragraph after the heading', () => {
		const body = [
			'# Roadmap',
			'',
			'What ships this quarter.',
			'',
			'More.',
		].join('\n')

		expect(firstParagraph(body, 'Roadmap')).toBe('What ships this quarter.')
	})

	it('joins a paragraph that wraps over several lines', () => {
		const body = ['# Roadmap', '', 'What ships', 'this quarter.'].join('\n')

		expect(firstParagraph(body, 'Roadmap')).toBe('What ships this quarter.')
	})

	it('skips every heading level', () => {
		const body = ['## Goals', '', '### Detail', '', 'The text.'].join('\n')

		expect(firstParagraph(body, 'Goals')).toBe('The text.')
	})

	it('skips a setext heading', () => {
		const body = ['Roadmap', '=======', '', 'The text.'].join('\n')

		expect(firstParagraph(body, 'Roadmap')).toBe('The text.')
	})

	it('skips a bullet list', () => {
		const body = ['- one', '- two', '', 'The text.'].join('\n')

		expect(firstParagraph(body, 'Notes')).toBe('The text.')
	})

	it('skips a numbered list', () => {
		const body = ['1. one', '2. two', '', 'The text.'].join('\n')

		expect(firstParagraph(body, 'Notes')).toBe('The text.')
	})

	it('skips a blockquote', () => {
		const body = ['> quoted', '', 'The text.'].join('\n')

		expect(firstParagraph(body, 'Notes')).toBe('The text.')
	})

	it('skips a table', () => {
		const body = ['| a | b |', '| - | - |', '| 1 | 2 |', '', 'The text.'].join(
			'\n'
		)

		expect(firstParagraph(body, 'Notes')).toBe('The text.')
	})

	it('skips a fenced code block', () => {
		const body = ['```ts', 'const answer = 42', '```', '', 'The text.'].join(
			'\n'
		)

		expect(firstParagraph(body, 'Notes')).toBe('The text.')
	})

	it('skips an indented code block', () => {
		const body = ['    const answer = 42', '', 'The text.'].join('\n')

		expect(firstParagraph(body, 'Notes')).toBe('The text.')
	})

	it('skips a thematic break', () => {
		const body = ['---', '', 'The text.'].join('\n')

		expect(firstParagraph(body, 'Notes')).toBe('The text.')
	})

	it('skips an HTML block', () => {
		const body = ['<div align="center">', '</div>', '', 'The text.'].join('\n')

		expect(firstParagraph(body, 'Notes')).toBe('The text.')
	})

	it('skips a line holding only an image', () => {
		const body = ['![logo](logo.png)', '', 'The text.'].join('\n')

		expect(firstParagraph(body, 'Notes')).toBe('The text.')
	})

	it('skips a link reference definition', () => {
		const body = ['[docs]: https://example.com', '', 'The text.'].join('\n')

		expect(firstParagraph(body, 'Notes')).toBe('The text.')
	})

	it('reduces inline markdown to the text a reader sees', () => {
		const body = [
			'**Bold** and [a link](https://example.com) with `code`.',
		].join('\n')

		expect(firstParagraph(body, 'Notes')).toBe('Bold and a link with code.')
	})

	it('cuts a long paragraph at a word boundary', () => {
		const body = `${'word '.repeat(80)}end`

		const paragraph = firstParagraph(body, 'Notes')

		expect(paragraph?.endsWith('…')).toBe(true)
		expect(paragraph?.length).toBeLessThanOrEqual(201)
		expect(paragraph).not.toMatch(/wor…$/)
	})

	it('leaves out a paragraph that only repeats the title', () => {
		const body = ['Buy milk', '', 'From the corner shop.'].join('\n')

		expect(firstParagraph(body, 'Buy milk')).toBe('From the corner shop.')
	})

	it('leaves out a paragraph the truncated title was cut from', () => {
		const first = `${'word '.repeat(30)}end`
		const body = [first, '', 'The text.'].join('\n')

		expect(firstParagraph(body, `${'word '.repeat(10).trim()}…`)).toBe(
			'The text.'
		)
	})

	it('is null for a note with no paragraph', () => {
		expect(
			firstParagraph(['# Roadmap', '', '- one'].join('\n'), 'Roadmap')
		).toBeNull()
	})

	it('is null for an empty note', () => {
		expect(firstParagraph('', 'notes.md')).toBeNull()
	})
})
