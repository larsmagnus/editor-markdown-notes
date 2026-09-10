import { describe, expect, it } from 'vitest'

import { headingDisplayText } from '#src/lib/link/heading-display-text'

describe('headingDisplayText', () => {
	it('strips the heading marker', () => {
		expect(headingDisplayText('## Title')).toBe('Title')
	})

	it('strips a deeper heading marker', () => {
		expect(headingDisplayText('###### Title')).toBe('Title')
	})

	it('strips bold delimiters, keeping the text', () => {
		expect(headingDisplayText('## **Bold** Title')).toBe('Bold Title')
	})

	it('strips inline code delimiters', () => {
		expect(headingDisplayText('## Title `code`')).toBe('Title code')
	})

	it('strips link syntax, keeping the link text', () => {
		expect(headingDisplayText('## [Link](./x.md) Title')).toBe('Link Title')
	})

	it('strips italic delimiters', () => {
		expect(headingDisplayText('## _Italic_ Title')).toBe('Italic Title')
	})

	it('strips strikethrough delimiters', () => {
		expect(headingDisplayText('## ~~Struck~~ Title')).toBe('Struck Title')
	})

	it('leaves plain text untouched', () => {
		expect(headingDisplayText('## Plain Title')).toBe('Plain Title')
	})

	it('handles a heading with no marker (already a bare line)', () => {
		expect(headingDisplayText('Plain Title')).toBe('Plain Title')
	})
})
