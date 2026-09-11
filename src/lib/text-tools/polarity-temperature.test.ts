import { describe, expect, it } from 'vitest'

import { polarityTemperature } from '#src/lib/text-tools/polarity-temperature'

describe('polarityTemperature', () => {
	it.each([
		[-1, 'very negative'],
		[-0.1, 'negative'],
		[0, 'neutral'],
		[0.1, 'positive'],
		[1, 'very positive'],
	])('scores %s as %s', (score, label) => {
		expect(polarityTemperature(score)).toEqual({
			score,
			label,
			text: `Document temperature: ${label}`,
		})
	})
})
