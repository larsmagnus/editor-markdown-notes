import { describe, expect, it } from 'vitest'

import { slugifyHeading } from '#src/lib/link/slugify-heading'

describe('slugifyHeading', () => {
	it('lowercases and hyphenates spaces', () => {
		expect(slugifyHeading('Hello World')).toBe('hello-world')
	})

	it('keeps non-ASCII letters', () => {
		expect(slugifyHeading('Café Life')).toBe('café-life')
	})

	it('collapses runs of spaces', () => {
		expect(slugifyHeading('Multiple   Spaces')).toBe('multiple-spaces')
	})

	it('strips punctuation', () => {
		expect(slugifyHeading('Trailing punctuation!')).toBe('trailing-punctuation')
	})

	it('keeps digits', () => {
		expect(slugifyHeading('100% Done')).toBe('100-done')
	})

	it('trims leading and trailing whitespace before hyphenating', () => {
		expect(slugifyHeading('  Padded  ')).toBe('padded')
	})

	it('returns an empty string for empty input', () => {
		expect(slugifyHeading('')).toBe('')
	})
})
