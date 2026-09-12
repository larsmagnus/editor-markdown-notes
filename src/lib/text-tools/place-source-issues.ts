import type { MarkdownSourceText } from '#src/lib/text-tools/markdown-source-text'
import { placeIssuesAt } from '#src/lib/text-tools/place-issues-at'
import { sourceOffsetAt } from '#src/lib/text-tools/source-offset'
import type { TextIssue } from '#src/lib/text-tools/types'
import type { TextToolRuleId } from '#src/shared/messages'

/** An issue with its offsets resolved to raw markdown source character offsets. */
export type SourcePlacedIssue = TextIssue & { from: number; to: number }

/**
 * The raw-editor counterpart of `place-issues.ts`: maps issues from text
 * offsets onto the raw markdown source string, via `placeIssuesAt`.
 */
export function placeSourceIssues(
	issues: TextIssue[],
	markdownSourceText: MarkdownSourceText,
	enabled: Set<TextToolRuleId>
): SourcePlacedIssue[] {
	return placeIssuesAt(issues, enabled, (offset) =>
		sourceOffsetAt(markdownSourceText.slices, offset)
	)
}
