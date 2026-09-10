import { describe, expect, it } from 'vitest'

import { resolveLinkHref } from '#src/lib/link/resolve-link-href'

describe('resolveLinkHref', () => {
	it('classifies an absolute URL as external', () => {
		expect(resolveLinkHref('https://example.com')).toEqual({ kind: 'external' })
	})

	it('classifies mailto as external', () => {
		expect(resolveLinkHref('mailto:me@x.com')).toEqual({ kind: 'external' })
	})

	it('classifies a hash-only href as a same-document hash', () => {
		expect(resolveLinkHref('#title')).toEqual({
			kind: 'same-document-hash',
			hash: 'title',
		})
	})

	it('classifies a dot-relative markdown link as relative', () => {
		expect(resolveLinkHref('./notes.md')).toEqual({
			kind: 'relative',
			href: './notes.md',
		})
	})

	it('keeps the hash attached to a relative href', () => {
		expect(resolveLinkHref('./notes.md#title')).toEqual({
			kind: 'relative',
			href: './notes.md#title',
		})
	})

	it('classifies a bare relative path as relative', () => {
		expect(resolveLinkHref('notes.md')).toEqual({
			kind: 'relative',
			href: 'notes.md',
		})
	})

	it('classifies an empty href as relative, leaving validation to the host', () => {
		expect(resolveLinkHref('')).toEqual({ kind: 'relative', href: '' })
	})
})
