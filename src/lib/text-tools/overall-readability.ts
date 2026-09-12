import { automatedReadability } from 'automated-readability'

import { VERY_HARD_AGE_OFFSET } from '#src/lib/text-tools/readability-issues'

export type OverallReadability = {
	age: number
	label: 'good' | 'ok' | 'poor'
	text: string
}

const LABELS = { good: 'Good', ok: 'OK', poor: 'Poor' } as const

/**
 * The Automated Readability Index converts to an age the same way
 * `retext-readability` does internally (grade + 5), since that's the
 * convention this app already scores sentences against.
 */
function ageOf(counts: {
	sentence: number
	word: number
	character: number
}): number {
	return Math.round(automatedReadability(counts) + 5)
}

/**
 * The whole document's reading difficulty, as a single verdict against
 * `targetAge` - distinct from the per-sentence hard/very-hard tiers, which
 * flag individual sentences rather than score the document as a whole.
 * `null` when there's nothing to score yet.
 */
export function overallReadability(
	counts: { sentence: number; word: number; character: number },
	targetAge: number
): OverallReadability | null {
	if (counts.sentence === 0 || counts.word === 0) return null

	const age = ageOf(counts)
	const label =
		age <= targetAge
			? 'good'
			: age <= targetAge + VERY_HARD_AGE_OFFSET
				? 'ok'
				: 'poor'

	return { age, label, text: `Readability: ${LABELS[label]} (age ${age})` }
}
