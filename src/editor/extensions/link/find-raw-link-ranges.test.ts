import { describe, expect, it } from 'vitest'

import { findRawLinkRanges } from '#src/editor/extensions/link/find-raw-link-ranges'

describe('findRawLinkRanges', () => {
	it('returns an empty array for text with no links', () => {
		expect(findRawLinkRanges('Just a plain sentence.')).toEqual([])
	})

	it('finds a single link, with the parens content bounds only', () => {
		const source = 'See [notes](./notes.md) for details.'
		expect(findRawLinkRanges(source)).toEqual([
			{ href: './notes.md', linkStart: 4, parensStart: 12, parensEnd: 22 },
		])
	})

	it('finds a same-document hash link', () => {
		const source = 'See [title](#title) above.'
		expect(findRawLinkRanges(source)).toEqual([
			{ href: '#title', linkStart: 4, parensStart: 12, parensEnd: 18 },
		])
	})

	it('finds a link inside a table cell row', () => {
		const source = '| [notes](./notes.md) | text |'
		expect(findRawLinkRanges(source)).toEqual([
			{ href: './notes.md', linkStart: 2, parensStart: 10, parensEnd: 20 },
		])
	})

	it('finds every link in a document with more than one', () => {
		const source = '[a](./a.md) and [b](./b.md)'
		expect(findRawLinkRanges(source)).toEqual([
			{ href: './a.md', linkStart: 0, parensStart: 4, parensEnd: 10 },
			{ href: './b.md', linkStart: 16, parensStart: 20, parensEnd: 26 },
		])
	})

	it('finds both the outer link and the nested image as separate ranges', () => {
		const source = '[![alt](img.png)](link.md)'
		expect(findRawLinkRanges(source)).toEqual([
			{ href: 'link.md', linkStart: 0, parensStart: 18, parensEnd: 25 },
			{ href: 'img.png', linkStart: 2, parensStart: 8, parensEnd: 15 },
		])
	})

	it('ignores an unterminated bracket', () => {
		expect(findRawLinkRanges('[notes not a link')).toEqual([])
	})
})
