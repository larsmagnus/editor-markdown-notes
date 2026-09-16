import { describe, expect, it } from 'vitest'

import {
	detectLinkClose,
	linkCloseText,
	linkCloseTokens,
	parseLinkClose,
} from '#src/editor/extensions/link/link-close-text'

describe('detectLinkClose', () => {
	it('detects a close with no title', () => {
		expect(detectLinkClose('](https://example.com)')).toBe(
			'](https://example.com)'.length
		)
	})

	it('detects a close with a title', () => {
		const text = '](https://example.com "The docs")'
		expect(detectLinkClose(text)).toBe(text.length)
	})

	it('detects only the close when other text precedes it', () => {
		const close = '](https://example.com)'
		expect(detectLinkClose(`[Docs${close}`)).toBe(close.length)
	})

	it('returns 0 for text with no close delimiter', () => {
		expect(detectLinkClose('Some notes')).toBe(0)
	})

	it('returns 0 for an unterminated close', () => {
		expect(detectLinkClose('](https://example.com')).toBe(0)
	})
})

describe('parseLinkClose', () => {
	it('parses an href with no title', () => {
		expect(parseLinkClose('](https://example.com)')).toEqual({
			href: 'https://example.com',
			title: null,
		})
	})

	it('parses an href with a title', () => {
		expect(parseLinkClose('](https://example.com "The docs")')).toEqual({
			href: 'https://example.com',
			title: 'The docs',
		})
	})

	it('unescapes parentheses in the href', () => {
		expect(parseLinkClose('](https://example.com/a\\(b\\))')).toEqual({
			href: 'https://example.com/a(b)',
			title: null,
		})
	})

	it('unescapes quotes in the title', () => {
		expect(
			parseLinkClose('](https://example.com "A \\"quoted\\" title")')
		).toEqual({
			href: 'https://example.com',
			title: 'A "quoted" title',
		})
	})

	it('returns null when the whole string is not a valid close delimiter', () => {
		expect(parseLinkClose('not a close')).toBeNull()
	})
})

describe('linkCloseText', () => {
	it('builds a close with no title', () => {
		expect(linkCloseText('https://example.com', null)).toBe(
			'](https://example.com)'
		)
	})

	it('builds a close with a title', () => {
		expect(linkCloseText('https://example.com', 'The docs')).toBe(
			'](https://example.com "The docs")'
		)
	})

	it('escapes parentheses in the href', () => {
		expect(linkCloseText('https://example.com/a(b)', null)).toBe(
			'](https://example.com/a\\(b\\))'
		)
	})

	it('escapes quotes in the title', () => {
		expect(linkCloseText('https://example.com', 'A "quoted" title')).toBe(
			'](https://example.com "A \\"quoted\\" title")'
		)
	})

	it('round-trips through parseLinkClose', () => {
		const built = linkCloseText('https://example.com/a(b)', 'A "title"')
		expect(parseLinkClose(built)).toEqual({
			href: 'https://example.com/a(b)',
			title: 'A "title"',
		})
	})
})

describe('linkCloseTokens', () => {
	it('splits a close with no title into brackets/parens and a url token', () => {
		const text = '](https://example.com)'
		expect(linkCloseTokens(text)).toEqual([
			{ role: 'marker', from: 0, to: 2 },
			{ role: 'url', from: 2, to: text.length - 1 },
			{ role: 'marker', from: text.length - 1, to: text.length },
		])
	})

	it('splits a close with a title into brackets/parens, a url, and a title token', () => {
		const text = '](https://example.com "The docs")'
		const hrefStart = 2
		const hrefEnd = hrefStart + 'https://example.com'.length
		const titleStart = text.indexOf('"')
		const titleEnd = text.lastIndexOf('"') + 1

		expect(linkCloseTokens(text)).toEqual([
			{ role: 'marker', from: 0, to: 2 },
			{ role: 'url', from: hrefStart, to: hrefEnd },
			{ role: 'title', from: titleStart, to: titleEnd },
			{ role: 'marker', from: text.length - 1, to: text.length },
		])
	})

	it('every token stays within the text and none overlap', () => {
		const text = '](https://example.com/a\\(b\\) "A \\"quoted\\" title")'
		const tokens = linkCloseTokens(text)

		expect(tokens[0]).toEqual({ role: 'marker', from: 0, to: 2 })
		expect(tokens.at(-1)).toEqual({
			role: 'marker',
			from: text.length - 1,
			to: text.length,
		})
		for (const token of tokens) {
			expect(token.from).toBeGreaterThanOrEqual(0)
			expect(token.to).toBeLessThanOrEqual(text.length)
			expect(token.from).toBeLessThan(token.to)
		}
	})

	it('returns an empty array for text that is not a valid close delimiter', () => {
		expect(linkCloseTokens('not a close')).toEqual([])
	})
})
