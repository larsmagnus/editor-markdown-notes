import { describe, expect, it } from 'vitest'

import { computeMinimalReplacement } from '#src/host/minimal-edit'

describe('computeMinimalReplacement', () => {
	it('returns null for identical text', () => {
		expect(computeMinimalReplacement('Ship it.', 'Ship it.')).toBeNull()
	})

	it('finds an append at the end', () => {
		expect(computeMinimalReplacement('Ship it.', 'Ship it. Today.')).toEqual({
			start: 8,
			end: 8,
			text: ' Today.',
		})
	})

	it('finds a prepend at the start', () => {
		expect(computeMinimalReplacement('Ship it.', 'Today. Ship it.')).toEqual({
			start: 0,
			end: 0,
			text: 'Today. ',
		})
	})

	it('finds an edit in the middle', () => {
		expect(
			computeMinimalReplacement(
				'# Roadmap\n\nShip it.',
				'# Roadmap\n\nShip today.'
			)
		).toEqual({
			start: 16,
			end: 18,
			text: 'today',
		})
	})

	it('finds a truncation to empty', () => {
		expect(computeMinimalReplacement('Ship it.', '')).toEqual({
			start: 0,
			end: 8,
			text: '',
		})
	})

	it('finds growth from empty', () => {
		expect(computeMinimalReplacement('', 'Ship it.')).toEqual({
			start: 0,
			end: 0,
			text: 'Ship it.',
		})
	})

	// The shared prefix and suffix must not overlap when the whole word changed
	// sits between two runs of the same character - "aaa" -> "aXa" naively
	// matches a prefix of "aa" and a suffix of "a", overlapping by one "a".
	it('does not let a shared prefix and suffix overlap', () => {
		expect(computeMinimalReplacement('aaa', 'aXa')).toEqual({
			start: 1,
			end: 2,
			text: 'X',
		})
	})

	// Confirms the prefix/suffix trim actually shrinks the edit, not just that
	// it produces a correct one - a regression here would still pass every
	// other case above by falling back to a full-document replacement. "today"
	// and "tomorrow" also share a "to" prefix, so the trimmed edit ends up
	// smaller than "the whole changed word" - still correct, just tighter.
	it('trims a long shared prefix and suffix down to the changed span', () => {
		const previous = '# Roadmap\n\nShip it today, not next week.\n\nDone.'
		const next = '# Roadmap\n\nShip it tomorrow, not next week.\n\nDone.'

		expect(computeMinimalReplacement(previous, next)).toEqual({
			start: 21,
			end: 24,
			text: 'morrow',
		})
	})
})
