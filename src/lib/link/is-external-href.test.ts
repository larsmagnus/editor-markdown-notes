import { describe, expect, it } from 'vitest'

import { isExternalHref } from '#src/lib/link/is-external-href'

describe('isExternalHref', () => {
	it('recognizes https URLs', () => {
		expect(isExternalHref('https://example.com')).toBe(true)
	})

	it('recognizes http URLs', () => {
		expect(isExternalHref('http://example.com')).toBe(true)
	})

	it('recognizes mailto links', () => {
		expect(isExternalHref('mailto:me@example.com')).toBe(true)
	})

	it('recognizes a vscode: URI', () => {
		expect(isExternalHref('vscode://file/notes.md')).toBe(true)
	})

	it('rejects a dot-relative path', () => {
		expect(isExternalHref('./notes.md')).toBe(false)
	})

	it('rejects a parent-relative path', () => {
		expect(isExternalHref('../notes.md')).toBe(false)
	})

	it('rejects a bare relative path', () => {
		expect(isExternalHref('notes.md')).toBe(false)
	})

	it('rejects a workspace-root-absolute path', () => {
		expect(isExternalHref('/notes.md')).toBe(false)
	})

	it('rejects a hash-only href', () => {
		expect(isExternalHref('#heading')).toBe(false)
	})

	it('rejects an empty href', () => {
		expect(isExternalHref('')).toBe(false)
	})

	it('rejects a Windows drive path', () => {
		expect(isExternalHref('C:\\notes.md')).toBe(false)
	})
})
