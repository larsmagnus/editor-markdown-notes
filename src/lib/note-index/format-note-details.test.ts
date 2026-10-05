import { describe, expect, it } from 'vitest'

import {
	formatCount,
	formatRelativeTime,
} from '#src/lib/note-index/format-note-details'

const NOW = Date.UTC(2026, 9, 5, 12, 0, 0)
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('formatRelativeTime', () => {
	it('abbreviates seconds to sec', () => {
		expect(formatRelativeTime(NOW - 30 * SECOND, NOW)).toBe('30 sec ago')
	})

	it('abbreviates minutes to min', () => {
		expect(formatRelativeTime(NOW - 5 * MINUTE, NOW)).toBe('5 min ago')
	})

	it('abbreviates a single minute', () => {
		expect(formatRelativeTime(NOW - MINUTE, NOW)).toBe('1 min ago')
	})

	it('keeps hours as they are', () => {
		expect(formatRelativeTime(NOW - 3 * HOUR, NOW)).toBe('3 hours ago')
	})

	it('keeps days as they are', () => {
		expect(formatRelativeTime(NOW - 3 * DAY, NOW)).toBe('3 days ago')
	})

	it('says yesterday for a day ago', () => {
		expect(formatRelativeTime(NOW - DAY, NOW)).toBe('yesterday')
	})
})

describe('formatCount', () => {
	it('groups the count and appends the unit', () => {
		expect(formatCount(13_322, 'chars')).toBe('13,322 chars')
	})
})
