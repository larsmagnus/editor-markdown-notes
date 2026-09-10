import { describe, expect, it } from 'vitest'

import { slugifyHeadings } from '#src/lib/link/slugify-headings'

describe('slugifyHeadings', () => {
	it('dedupes a single repeat with a -1 suffix', () => {
		expect(slugifyHeadings(['Intro', 'Intro'])).toEqual(['intro', 'intro-1'])
	})

	it('dedupes multiple repeats in document order', () => {
		expect(slugifyHeadings(['Intro', 'Intro', 'Intro'])).toEqual([
			'intro',
			'intro-1',
			'intro-2',
		])
	})

	it('leaves distinct headings alone', () => {
		expect(slugifyHeadings(['A', 'B'])).toEqual(['a', 'b'])
	})

	it('returns an empty array for no headings', () => {
		expect(slugifyHeadings([])).toEqual([])
	})
})
