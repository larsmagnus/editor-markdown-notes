import { describe, expect, it } from 'vitest'

import {
	bulletMarkerText,
	orderedMarkerText,
	parseListMarker,
	taskMarkerText,
} from '@/editor/extensions/list/list-marker'

describe('parseListMarker', () => {
	it('parses a dash bullet', () => {
		expect(parseListMarker('- First item')).toEqual({
			kind: 'bullet',
			bulletChar: '-',
			markerLength: 2,
		})
	})

	it('parses a plus/asterisk bullet', () => {
		expect(parseListMarker('+ Item')).toEqual({
			kind: 'bullet',
			bulletChar: '+',
			markerLength: 2,
		})
		expect(parseListMarker('* Item')).toEqual({
			kind: 'bullet',
			bulletChar: '*',
			markerLength: 2,
		})
	})

	it('parses a dot-ordered marker', () => {
		expect(parseListMarker('12. Item')).toEqual({
			kind: 'ordered',
			number: 12,
			markerLength: 4,
		})
	})

	it('parses a paren-ordered marker', () => {
		expect(parseListMarker('3) Item')).toEqual({
			kind: 'ordered',
			number: 3,
			markerLength: 3,
		})
	})

	it('parses an unchecked task marker', () => {
		expect(parseListMarker('- [ ] Item')).toEqual({
			kind: 'task',
			checked: false,
			markerLength: 6,
		})
	})

	it('parses a checked task marker, case-insensitively', () => {
		expect(parseListMarker('- [x] Item')).toEqual({
			kind: 'task',
			checked: true,
			markerLength: 6,
		})
		expect(parseListMarker('- [X] Item')).toEqual({
			kind: 'task',
			checked: true,
			markerLength: 6,
		})
	})

	it('prefers the task pattern over the bullet pattern it extends', () => {
		expect(parseListMarker('- [ ] Item')?.kind).toBe('task')
	})

	it('returns null for text with no marker yet', () => {
		expect(parseListMarker('Just typing')).toBeNull()
	})

	it('returns null for a bare dash with no trailing space', () => {
		expect(parseListMarker('-Item')).toBeNull()
	})
})

describe('bulletMarkerText', () => {
	it('defaults to a dash', () => {
		expect(bulletMarkerText()).toBe('- ')
	})

	it('preserves a different bullet character', () => {
		expect(bulletMarkerText('*')).toBe('* ')
	})
})

describe('orderedMarkerText', () => {
	it('builds a dot marker for the given number', () => {
		expect(orderedMarkerText(1)).toBe('1. ')
		expect(orderedMarkerText(12)).toBe('12. ')
	})
})

describe('taskMarkerText', () => {
	it('builds an unchecked marker', () => {
		expect(taskMarkerText(false)).toBe('- [ ] ')
	})

	it('builds a checked marker', () => {
		expect(taskMarkerText(true)).toBe('- [x] ')
	})
})
