import { describe, expect, it } from 'vitest'

import { dashRateSummary } from '#src/lib/text-tools/dash-rate-summary'

describe('dashRateSummary', () => {
	it('reports nothing when the rate is at or under the threshold', () => {
		expect(dashRateSummary(3, 10)).toBeNull()
	})

	it('reports the rate and a dash-heavy line once the rate clears the threshold', () => {
		expect(dashRateSummary(4, 10)).toEqual({
			rate: 0.4,
			text: '4 em/en dashes across 10 sentences - dash-heavy',
		})
	})

	it('says "sentence" rather than "sentences" for a single-sentence document', () => {
		expect(dashRateSummary(2, 1)).toEqual({
			rate: 2,
			text: '2 em/en dashes across 1 sentence - dash-heavy',
		})
	})

	it('reports nothing for a document with no sentences', () => {
		expect(dashRateSummary(0, 0)).toBeNull()
	})
})
