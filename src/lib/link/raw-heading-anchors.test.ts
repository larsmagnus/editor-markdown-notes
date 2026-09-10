import { describe, expect, it } from 'vitest'

import { findRawHeadingAnchors } from '#src/lib/link/raw-heading-anchors'

describe('findRawHeadingAnchors', () => {
	it('finds a single heading and its offset', () => {
		const source = '# Title\n\nBody text.\n'
		expect(findRawHeadingAnchors(source)).toEqual([
			{ hash: 'title', offset: 0 },
		])
	})

	it('finds multiple headings at their line offsets', () => {
		const source = '# Title\n\nBody.\n\n## Second\n'
		const anchors = findRawHeadingAnchors(source)
		expect(anchors).toEqual([
			{ hash: 'title', offset: 0 },
			{ hash: 'second', offset: source.indexOf('## Second') },
		])
	})

	it('dedupes repeated heading text', () => {
		const source = '# Intro\n\n## Intro\n'
		expect(findRawHeadingAnchors(source)).toEqual([
			{ hash: 'intro', offset: 0 },
			{ hash: 'intro-1', offset: source.indexOf('## Intro') },
		])
	})

	it('ignores a line that looks like a heading inside a fenced code block', () => {
		const source = '# Real\n\n```\n# Not a heading\n```\n\n## Also Real\n'
		expect(findRawHeadingAnchors(source)).toEqual([
			{ hash: 'real', offset: 0 },
			{ hash: 'also-real', offset: source.indexOf('## Also Real') },
		])
	})

	it('strips inline markdown syntax before slugifying, matching heading-display-text', () => {
		const source = '## **Bold** Title\n'
		expect(findRawHeadingAnchors(source)).toEqual([
			{ hash: 'bold-title', offset: 0 },
		])
	})

	it('returns an empty array for a document with no headings', () => {
		expect(findRawHeadingAnchors('Just a paragraph.\n')).toEqual([])
	})
})
