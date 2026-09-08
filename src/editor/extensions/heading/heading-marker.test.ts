import { describe, expect, it } from 'vitest'

import {
	headingMarkerLength,
	headingMarkerText,
	parseHeadingLevel,
} from '#src/editor/extensions/heading/heading-marker'

describe('parseHeadingLevel', () => {
	it('reads the level from each of the six valid marker lengths', () => {
		expect(parseHeadingLevel('# One')).toBe(1)
		expect(parseHeadingLevel('## Two')).toBe(2)
		expect(parseHeadingLevel('### Three')).toBe(3)
		expect(parseHeadingLevel('#### Four')).toBe(4)
		expect(parseHeadingLevel('##### Five')).toBe(5)
		expect(parseHeadingLevel('###### Six')).toBe(6)
	})

	it('falls back to level 1 for text with no marker yet', () => {
		expect(parseHeadingLevel('Some notes')).toBe(1)
	})

	it('falls back to level 1 for a run of seven or more #s', () => {
		expect(parseHeadingLevel('####### Not a heading')).toBe(1)
	})

	it('falls back to level 1 for a bare # with no trailing space', () => {
		expect(parseHeadingLevel('#Notes')).toBe(1)
	})
})

describe('headingMarkerLength', () => {
	it('measures the marker including its trailing space', () => {
		expect(headingMarkerLength('## Two')).toBe(3)
	})

	it('is 0 for text with no marker yet', () => {
		expect(headingMarkerLength('Some notes')).toBe(0)
	})
})

describe('headingMarkerText', () => {
	it('builds the marker for each of the six levels', () => {
		expect(headingMarkerText(1)).toBe('# ')
		expect(headingMarkerText(6)).toBe('###### ')
	})
})
