import { describe, expect, it } from 'vitest'

import { hasLinkScheme } from '#src/editor/extensions/link/has-link-scheme'

describe('hasLinkScheme', () => {
	it('accepts http', () => {
		expect(hasLinkScheme('http://example.com')).toBe(true)
	})

	it('accepts https', () => {
		expect(hasLinkScheme('https://example.com/wiki/Foo_(bar)')).toBe(true)
	})

	it('accepts ftp', () => {
		expect(hasLinkScheme('ftp://files.example.com')).toBe(true)
	})

	it('accepts mailto', () => {
		expect(hasLinkScheme('mailto:user-123@example.com')).toBe(true)
	})

	it('rejects a www. address', () => {
		expect(hasLinkScheme('www.example.com')).toBe(false)
	})

	it('rejects a file name', () => {
		expect(hasLinkScheme('notes.md')).toBe(false)
	})

	it('rejects a bare email address', () => {
		expect(hasLinkScheme('user-123@example.com')).toBe(false)
	})
})
