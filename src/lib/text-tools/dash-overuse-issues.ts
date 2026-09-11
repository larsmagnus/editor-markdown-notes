import type { Root } from 'nlcst'

import { dashClusterIssues } from '#src/lib/text-tools/dash-cluster-issues'
import { dashRateSummary } from '#src/lib/text-tools/dash-rate-summary'
import type { DashOveruseSummary } from '#src/lib/text-tools/dash-rate-summary'
import { textRangesOf } from '#src/lib/text-tools/text-ranges-of'
import type { TextIssue } from '#src/lib/text-tools/types'

const DASH_PATTERN = /[—–]/g

type SentenceInfo = {
	text: string
	start: number
	end: number
	dashCount: number
}

function sentenceInfo(tree: Root): SentenceInfo[] {
	return textRangesOf(tree, 'SentenceNode').map((range) => ({
		...range,
		dashCount: (range.text.match(DASH_PATTERN) ?? []).length,
	}))
}

/** A sentence with 2+ dashes, flagged on its own - the "dense sentence" tier. */
function denseSentenceIssues(sentences: SentenceInfo[]): TextIssue[] {
	return sentences
		.filter((sentence) => sentence.dashCount >= 2)
		.map((sentence) => ({
			ruleId: 'dashOveruse',
			severity: 'warning',
			message: `This sentence uses ${sentence.dashCount} dashes.`,
			actual: sentence.text,
			expected: [],
			start: sentence.start,
			end: sentence.end,
		}))
}

/**
 * Em/en dash overuse, in three tiers: a sentence dense with dashes on its
 * own, a run of neighbouring sentences that each reach for one
 * (`dash-cluster-issues.ts`), and the document's overall rate
 * (`dash-rate-summary.ts`) - each catches a pattern the other two miss.
 */
export function dashOveruseIssues(
	tree: Root,
	sentenceCount: number
): { issues: TextIssue[]; summary: DashOveruseSummary | null } {
	const sentences = sentenceInfo(tree)
	const totalDashes = sentences.reduce(
		(sum, sentence) => sum + sentence.dashCount,
		0
	)

	return {
		issues: [
			...denseSentenceIssues(sentences),
			...dashClusterIssues(sentences),
		],
		summary: dashRateSummary(totalDashes, sentenceCount),
	}
}
