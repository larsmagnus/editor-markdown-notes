export type SentenceRange = { start: number; end: number }

/**
 * Maximal runs of consecutive sentences where a sliding window of `window`
 * sentences contains at least `minHits` dash-carrying ones - the "gasping"
 * rhythm a single dense sentence or a flat document-wide rate can't catch,
 * since neither looks at how dashes are spread across neighbouring sentences.
 *
 * Overlapping and touching windows merge into one run, so a document that
 * trips the threshold for ten sentences in a row is reported once, not once
 * per window position. Shorter than `window` sentences never qualifies -
 * there aren't enough neighbours to call it a pattern.
 */
export function findDashClusters(
	hasDash: boolean[],
	window: number,
	minHits: number
): SentenceRange[] {
	if (hasDash.length < window) return []

	const clusters: SentenceRange[] = []
	let current: SentenceRange | null = null

	for (let index = 0; index + window <= hasDash.length; index++) {
		const hits = hasDash.slice(index, index + window).filter(Boolean).length
		if (hits < minHits) continue

		const windowEnd = index + window - 1
		if (current && index <= current.end + 1) {
			current.end = Math.max(current.end, windowEnd)
		} else {
			current = { start: index, end: windowEnd }
			clusters.push(current)
		}
	}

	return clusters
}
