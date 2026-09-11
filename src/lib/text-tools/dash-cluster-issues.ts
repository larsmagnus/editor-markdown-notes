import { findDashClusters } from '#src/lib/text-tools/find-dash-clusters'
import type { TextIssue } from '#src/lib/text-tools/types'

type Sentence = { text: string; start: number; end: number; dashCount: number }

/**
 * A window of five consecutive sentences where three or more each carry a
 * dash reads as a rhythm problem even when no single sentence is overloaded -
 * this is the "adjacent sentences" tier `findDashClusters` finds runs for.
 */
const CLUSTER_WINDOW = 5
const CLUSTER_MIN_HITS = 3

/** One `TextIssue` per run of sentences that each lean on a dash. */
export function dashClusterIssues(sentences: Sentence[]): TextIssue[] {
	const hasDash = sentences.map((sentence) => sentence.dashCount > 0)

	return findDashClusters(hasDash, CLUSTER_WINDOW, CLUSTER_MIN_HITS).map(
		(cluster) => {
			const span = sentences.slice(cluster.start, cluster.end + 1)
			const dashSentences = span.filter(
				(sentence) => sentence.dashCount > 0
			).length

			return {
				ruleId: 'dashOveruse',
				severity: 'warning',
				message: `${dashSentences} of these ${span.length} sentences use a dash.`,
				actual: span.map((sentence) => sentence.text).join(' '),
				expected: [],
				start: span[0].start,
				end: span[span.length - 1].end,
			}
		}
	)
}
