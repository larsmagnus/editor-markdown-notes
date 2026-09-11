import { describe, expect, it } from 'vitest'

import { findDashClusters } from '#src/lib/text-tools/find-dash-clusters'

describe('findDashClusters', () => {
	it('finds no cluster when fewer sentences exist than the window', () => {
		const hasDash = [true, true, true]

		expect(findDashClusters(hasDash, 5, 3)).toEqual([])
	})

	it('finds no cluster when no window meets the hit threshold', () => {
		const hasDash = [true, false, false, true, false, false, true]

		expect(findDashClusters(hasDash, 5, 3)).toEqual([])
	})

	it('finds one cluster spanning the qualifying window', () => {
		const hasDash = [true, true, false, true, false]

		expect(findDashClusters(hasDash, 5, 3)).toEqual([{ start: 0, end: 4 }])
	})

	it('merges overlapping windows into a single run', () => {
		// Ten sentences, every other one carrying a dash - every window of 5
		// starting at indexes 0-5 hits the 3-of-5 threshold, so the run should
		// cover the whole document rather than being reported ten times.
		const hasDash = [
			true,
			false,
			true,
			false,
			true,
			false,
			true,
			false,
			true,
			false,
		]

		expect(findDashClusters(hasDash, 5, 3)).toEqual([{ start: 0, end: 8 }])
	})

	it('reports two separate clusters when a calm gap separates them', () => {
		// window=3, minHits=2: a qualifying window can dip one sentence into a
		// calm run on either side of a block (window - minHits = 1), so a block
		// of three at 0-2 reports as 0-3, and a block at 8-10 as 7-10 - the
		// five calm sentences at 3-7 are the buffer that keeps them apart.
		const hasDash = [
			true,
			true,
			true, // cluster one's block: indexes 0-2
			false,
			false,
			false,
			false,
			false, // five calm sentences: indexes 3-7
			true,
			true,
			true, // cluster two's block: indexes 8-10
		]

		expect(findDashClusters(hasDash, 3, 2)).toEqual([
			{ start: 0, end: 3 },
			{ start: 7, end: 10 },
		])
	})
})
