export type DashOveruseSummary = { rate: number; text: string }

/**
 * Dashes per sentence, document-wide, above which the document reads as
 * dash-heavy even without a dense sentence or a tight cluster - dashes spread
 * evenly rather than bunched. Set below the densest a document can get while
 * still dodging `dash-cluster-issues.ts`'s cluster tier (evenly-spaced dashes
 * can't exceed roughly 2-in-5 without also tripping a 3-in-5 window), so this
 * tier is reachable on its own rather than always riding along with a cluster.
 */
const DOCUMENT_RATE_THRESHOLD = 0.3

/** The document-wide dash rate, `null` when it's under the dash-heavy threshold. */
export function dashRateSummary(
	totalDashes: number,
	sentenceCount: number
): DashOveruseSummary | null {
	const rate = sentenceCount > 0 ? totalDashes / sentenceCount : 0
	if (rate <= DOCUMENT_RATE_THRESHOLD) return null

	return {
		rate,
		text: `${totalDashes} em/en dashes across ${sentenceCount} ${
			sentenceCount === 1 ? 'sentence' : 'sentences'
		} - dash-heavy`,
	}
}
