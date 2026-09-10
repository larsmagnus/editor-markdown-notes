import { describe, expect, it } from 'vitest'

import { findLinkAtOffset } from '#src/editor/extensions/link/raw-link-at-offset'

describe('findLinkAtOffset', () => {
	it('finds a link when the offset is inside the href', () => {
		const source = 'See [notes](./notes.md) for details.'
		const offset = source.indexOf('./notes.md') + 2
		expect(findLinkAtOffset(source, offset)).toEqual({
			href: './notes.md',
			start: 12,
			end: 22,
		})
	})

	it('does not find a link when the offset is inside the link text', () => {
		const source = 'See [notes](./notes.md) for details.'
		const offset = source.indexOf('notes]')
		expect(findLinkAtOffset(source, offset)).toBeNull()
	})

	it('does not find a link when the offset is on the opening bracket', () => {
		const source = '[notes](./notes.md)'
		expect(findLinkAtOffset(source, 0)).toBeNull()
	})

	it('does not find a link when the offset is on the opening paren', () => {
		const source = '[notes](./notes.md)'
		expect(findLinkAtOffset(source, source.indexOf('('))).toBeNull()
	})

	it('finds a link at the first character of the href', () => {
		const source = '[notes](./notes.md)'
		const offset = source.indexOf('(') + 1
		expect(findLinkAtOffset(source, offset)).toEqual({
			href: './notes.md',
			start: 8,
			end: 18,
		})
	})

	it('does not find a link when the offset is on the closing paren', () => {
		const source = '[notes](./notes.md)'
		expect(findLinkAtOffset(source, source.length - 1)).toBeNull()
	})

	it('returns null when the offset is outside any link', () => {
		const source = 'See [notes](./notes.md) for details.'
		const offset = source.indexOf('for details')
		expect(findLinkAtOffset(source, offset)).toBeNull()
	})

	it('finds a link inside a table cell row', () => {
		const source = '| [notes](./notes.md) | text |'
		const offset = source.indexOf('./notes.md') + 2
		expect(findLinkAtOffset(source, offset)).toEqual({
			href: './notes.md',
			start: 10,
			end: 20,
		})
	})

	it('finds a same-document hash link', () => {
		const source = 'See [title](#title) above.'
		const offset = source.indexOf('#title') + 2
		expect(findLinkAtOffset(source, offset)).toEqual({
			href: '#title',
			start: 12,
			end: 18,
		})
	})

	it('returns null on plain prose with no brackets nearby', () => {
		const source = 'Just a plain sentence with no links at all.'
		expect(findLinkAtOffset(source, 10)).toBeNull()
	})

	it('resolves the outer link href when the offset is on its own parens content', () => {
		const source = '[![alt](img.png)](link.md)'
		const offset = source.indexOf('link.md')
		expect(findLinkAtOffset(source, offset)).toEqual({
			href: 'link.md',
			start: 18,
			end: 25,
		})
	})

	it('resolves the nested image href when the offset is on its own parens content', () => {
		const source = '[![alt](img.png)](link.md)'
		const offset = source.indexOf('img.png')
		expect(findLinkAtOffset(source, offset)).toEqual({
			href: 'img.png',
			start: 8,
			end: 15,
		})
	})

	it('does not find a link when the offset is on the nested image alt text', () => {
		const source = '[![alt](img.png)](link.md)'
		const offset = source.indexOf('alt')
		expect(findLinkAtOffset(source, offset)).toBeNull()
	})
})
