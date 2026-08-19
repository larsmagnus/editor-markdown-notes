import type { PlacedIssue } from '@/editor/text-tools-extension'
import type { DocumentText } from '@/lib/text-tools/document-text'
import { offsetToPosition } from '@/lib/text-tools/offset-to-position'
import type { TextIssue } from '@/lib/text-tools/types'
import type { TextToolRuleId } from '@/shared/messages'

/**
 * Maps issues from text offsets onto document positions, dropping any that no
 * longer land on real text.
 *
 * Rules are filtered here as well as in the worker, so the highlights and the
 * panel - which filters the same analysis through `summarize` - can never
 * disagree about which rules are on.
 */
export function placeIssues(
	issues: TextIssue[],
	documentText: DocumentText,
	enabled: Set<TextToolRuleId>
): PlacedIssue[] {
	return issues.flatMap((issue): PlacedIssue[] => {
		if (!enabled.has(issue.ruleId)) return []

		const from = offsetToPosition(documentText, issue.start)
		const to = offsetToPosition(documentText, issue.end)
		if (from === null || to === null || from >= to) return []

		return [{ ...issue, from, to }]
	})
}
