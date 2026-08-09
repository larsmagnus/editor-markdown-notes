import { describe, expect, it } from 'vitest'

import {
	fromToggleValues,
	toToggleValues,
} from '@/components/view-toggle-options'
import { DEFAULT_VIEW_OPTIONS } from '@/shared/messages'

/**
 * The toggle group rebuilds every option from the values it hands back, so a
 * key missing from either direction silently resets itself. All four
 * combinations round-trip to prove neither direction has a gap.
 */
const COMBINATIONS = [
	{ fullWidth: false, textTools: false },
	{ fullWidth: true, textTools: false },
	{ fullWidth: false, textTools: true },
	{ fullWidth: true, textTools: true },
]

describe('view toggle round trip', () => {
	for (const combination of COMBINATIONS) {
		const pressed =
			Object.entries(combination)
				.filter(([, on]) => on)
				.map(([key]) => key)
				.join(', ') || 'nothing'

		it(`survives a round trip with ${pressed} on`, () => {
			const values = toToggleValues({ ...DEFAULT_VIEW_OPTIONS, ...combination })

			expect(fromToggleValues(values)).toEqual(combination)
		})
	}
})

describe('toToggleValues', () => {
	it('uses the toggle group value, which is not the option name', () => {
		const values = toToggleValues({ ...DEFAULT_VIEW_OPTIONS, fullWidth: true })

		expect(values).toEqual(['max-w-full'])
	})
})

describe('fromToggleValues', () => {
	it('ignores a value that belongs to no toggle', () => {
		expect(fromToggleValues(['max-w-full', 'something-else'])).toEqual({
			fullWidth: true,
			textTools: false,
		})
	})
})
