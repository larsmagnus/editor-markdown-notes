import type { TextIssue } from '#src/lib/text-tools/types'
import type { TextToolRuleId } from '#src/shared/messages'

/**
 * The shared placement logic behind both `place-issues.ts` (ProseMirror
 * positions) and `place-source-issues.ts` (raw markdown source offsets):
 * filter by enabled rule, map each issue's text offsets through the given
 * coordinate space, and drop anything that no longer lands on real text.
 *
 * Rules are filtered here as well as in the worker, so the highlights and the
 * panel - which filters the same analysis through `summarize` - can never
 * disagree about which rules are on.
 */
export function placeIssuesAt<Issue extends TextIssue>(
	issues: Issue[],
	enabled: Set<TextToolRuleId>,
	mapOffset: (offset: number) => number | null
): (Issue & { from: number; to: number })[] {
	return issues.flatMap((issue) => {
		if (!enabled.has(issue.ruleId)) return []

		const from = mapOffset(issue.start)
		const to = mapOffset(issue.end)
		if (from === null || to === null || from >= to) return []

		return [{ ...issue, from, to }]
	})
}
