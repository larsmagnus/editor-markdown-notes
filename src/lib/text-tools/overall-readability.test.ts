import { describe, expect, it } from 'vitest'

import { overallReadability } from '#src/lib/text-tools/overall-readability'

describe('overallReadability', () => {
	it.each([
		[{ sentence: 10, word: 100, character: 400 }, 'good', 7],
		[{ sentence: 10, word: 100, character: 580 }, 'good', 16],
		[{ sentence: 5, word: 100, character: 600 }, 'ok', 22],
		[{ sentence: 5, word: 100, character: 616 }, 'poor', 23],
		[{ sentence: 3, word: 100, character: 700 }, 'poor', 33],
	] as const)(
		'scores %o against a target age of 16 as %s (age %i)',
		(counts, label, age) => {
			expect(overallReadability(counts, 16)).toEqual({
				age,
				label,
				text: `Readability: ${label === 'ok' ? 'OK' : label === 'good' ? 'Good' : 'Poor'} (age ${age})`,
			})
		}
	)

	it('returns null for a document with no sentences', () => {
		expect(overallReadability({ sentence: 0, word: 0, character: 0 }, 16)).toBe(
			null
		)
	})

	it('returns null for a document with no words', () => {
		expect(overallReadability({ sentence: 1, word: 0, character: 0 }, 16)).toBe(
			null
		)
	})
})
