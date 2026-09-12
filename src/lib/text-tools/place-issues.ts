import type { PlacedIssue } from '#src/editor/extensions/text-tools/text-tools-extension'
import type { DocumentText } from '#src/lib/text-tools/document-text'
import { offsetToPosition } from '#src/lib/text-tools/offset-to-position'
import { placeIssuesAt } from '#src/lib/text-tools/place-issues-at'
import type { TextIssue } from '#src/lib/text-tools/types'
import type { TextToolRuleId } from '#src/shared/messages'

/**
 * Maps issues from text offsets onto ProseMirror document positions, via
 * `placeIssuesAt`.
 */
export function placeIssues(
	issues: TextIssue[],
	documentText: DocumentText,
	enabled: Set<TextToolRuleId>
): PlacedIssue[] {
	return placeIssuesAt(issues, enabled, (offset) =>
		offsetToPosition(documentText, offset)
	)
}
