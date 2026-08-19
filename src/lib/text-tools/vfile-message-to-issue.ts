import type { VFileMessage } from 'vfile-message'

import type { TextIssue } from '@/lib/text-tools/types'
import type { TextToolRuleId } from '@/shared/messages'

/**
 * Turning retext's messages into issues the editor can place.
 *
 * Deliberately free of any retext import: `run-pipeline.ts` statically pulls in
 * the whole ~43kB stack and must stay the worker's alone, so anything the tests
 * or the main thread might reach for lives here instead.
 */

/**
 * The `source` each rule's messages arrive under. Declared in this direction so
 * it is keyed by `TextToolRuleId` and a new rule cannot compile without one -
 * the reverse map is derived below. Keyed the other way a missing entry would
 * typecheck and the rule would simply report nothing.
 *
 * Matched on `source` rather than `ruleId` because retext-passive sets `ruleId`
 * to the offending word rather than a category.
 */
const RULE_SOURCES: Record<TextToolRuleId, string> = {
	passive: 'retext-passive',
	simplify: 'retext-simplify',
	intensify: 'retext-intensify',
	readability: 'retext-readability',
	spelling: 'retext-spell',
}

const SOURCE_TO_RULE = new Map(
	Object.entries(RULE_SOURCES).map(([ruleId, source]) => [
		source,
		ruleId as TextToolRuleId,
	])
)

/**
 * `place` widens to a bare `Point` for messages that mark a spot rather than a
 * range. Every rule here reports a range, but the narrowing keeps that honest.
 */
export function offsetsOf(message: VFileMessage) {
	const place = message.place
	if (!place || !('start' in place)) return null

	const { start, end } = place
	if (start.offset === undefined || end.offset === undefined) return null

	return { start: start.offset, end: end.offset }
}

export function toIssue(
	message: VFileMessage,
	severity: TextIssue['severity']
): TextIssue | null {
	const ruleId = message.source ? SOURCE_TO_RULE.get(message.source) : undefined
	const offsets = offsetsOf(message)

	// A message without a source we know or without offsets cannot be placed in
	// the document, and a decoration is the whole point.
	if (!ruleId || !offsets) return null

	return {
		ruleId,
		severity,
		message: message.reason,
		actual: message.actual ?? '',
		expected: message.expected ?? [],
		start: offsets.start,
		end: offsets.end,
	}
}
