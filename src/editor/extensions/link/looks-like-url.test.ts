import { describe, it, expect } from 'vitest'

import { looksLikeUrl } from '#src/editor/extensions/link/looks-like-url'

describe('looksLikeUrl', () => {
	it('accepts http:// URLs', () => {
		expect(looksLikeUrl('http://example.com')).toBe(true)
	})

	it('accepts https:// URLs', () => {
		expect(looksLikeUrl('https://example.com')).toBe(true)
	})

	it('accepts URLs with paths and query parameters', () => {
		expect(looksLikeUrl('https://example.com/path?query=value')).toBe(true)
	})

	it('trims whitespace before testing', () => {
		expect(looksLikeUrl('  https://example.com  ')).toBe(true)
	})

	it('rejects www. URLs without protocol', () => {
		expect(looksLikeUrl('www.example.com')).toBe(false)
	})

	it('rejects relative paths', () => {
		expect(looksLikeUrl('/path/to/page')).toBe(false)
		expect(looksLikeUrl('../page')).toBe(false)
	})

	it('rejects email addresses', () => {
		expect(looksLikeUrl('user@example.com')).toBe(false)
	})

	it('rejects URLs embedded in larger text', () => {
		expect(looksLikeUrl('check out https://example.com for more')).toBe(false)
	})

	it('accepts ftp:// URLs', () => {
		expect(looksLikeUrl('ftp://example.com')).toBe(true)
	})

	it('accepts mailto: addresses', () => {
		expect(looksLikeUrl('mailto:user-123@example.com')).toBe(true)
	})

	it('rejects a scheme it does not know', () => {
		expect(looksLikeUrl('slack://channel')).toBe(false)
	})

	it('rejects empty string', () => {
		expect(looksLikeUrl('')).toBe(false)
	})

	it('rejects whitespace-only string', () => {
		expect(looksLikeUrl('   ')).toBe(false)
	})
})
