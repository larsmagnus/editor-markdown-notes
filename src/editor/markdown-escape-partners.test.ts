import { describe, expect, it } from 'vitest'

import {
	backtickRuns,
	flankingAsteriskOffsets,
	hasFlankingAsteriskPartner,
	hasMatchingBacktickRun,
} from '@/editor/markdown-escape-partners'

describe('flankingAsteriskOffsets', () => {
	it('excludes an asterisk flanked by whitespace on both sides', () => {
		expect(flankingAsteriskOffsets('5 * 3')).toEqual(new Set())
	})

	it('includes an asterisk flanked by non-whitespace', () => {
		expect(flankingAsteriskOffsets('a*b')).toEqual(new Set([1]))
	})

	it('includes every flanking asterisk in a run with several', () => {
		expect(flankingAsteriskOffsets('a*b*c')).toEqual(new Set([1, 3]))
	})
})

describe('hasFlankingAsteriskPartner', () => {
	it('is false for the only flanking asterisk in the string', () => {
		const offsets = flankingAsteriskOffsets('a*b')
		expect(hasFlankingAsteriskPartner(offsets, 1)).toBe(false)
	})

	it('is true when another flanking asterisk exists elsewhere', () => {
		const offsets = flankingAsteriskOffsets('a*b*c')
		expect(hasFlankingAsteriskPartner(offsets, 1)).toBe(true)
		expect(hasFlankingAsteriskPartner(offsets, 3)).toBe(true)
	})

	it('is false for a non-flanking offset even if other asterisks are flanking', () => {
		const offsets = flankingAsteriskOffsets('5 * 3 and a*b')
		expect(hasFlankingAsteriskPartner(offsets, 2)).toBe(false)
	})
})

describe('backtickRuns', () => {
	it('finds each maximal run of backticks with its start and length', () => {
		expect(backtickRuns('a`b c``d')).toEqual([
			{ start: 1, length: 1 },
			{ start: 5, length: 2 },
		])
	})
})

describe('hasMatchingBacktickRun', () => {
	it('is false when no other run shares its length', () => {
		const runs = backtickRuns('a`b c``d')
		expect(hasMatchingBacktickRun(runs, 1)).toBe(false)
		expect(hasMatchingBacktickRun(runs, 5)).toBe(false)
	})

	it('is true when another run has the same length', () => {
		const runs = backtickRuns('x`y``z`w')
		expect(hasMatchingBacktickRun(runs, 1)).toBe(true)
		expect(hasMatchingBacktickRun(runs, 6)).toBe(true)
		expect(hasMatchingBacktickRun(runs, 3)).toBe(false)
	})

	it('is false for an offset outside any backtick run', () => {
		const runs = backtickRuns('a`b')
		expect(hasMatchingBacktickRun(runs, 0)).toBe(false)
	})
})
