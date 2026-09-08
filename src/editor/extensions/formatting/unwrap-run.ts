import type { MarkType } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

import type { DelimiterSpec } from '#src/editor/extensions/formatting/delimiter-spec'
import type { MarkRun } from '#src/editor/extensions/formatting/find-mark-runs'

/**
 * Strips one run's mark and the delimiter text at its two ends, returning the
 * bare text range left behind. The mark-side counterpart to a block
 * construct's `unwrap`, and the single answer to "this text should stop being
 * styled" for every route there is: the toolbar toggle, Backspace or Delete
 * against a delimiter, unlinking, and the repair pass finding a delimiter the
 * author removed.
 *
 * Both ends go together. A run keeping one delimiter would serialize as prose
 * that reads as half a construct, and on the next load markdown-it would pair
 * it with whatever came next.
 *
 * Lengths are detected via `spec` rather than assumed fixed - inline code's
 * fence varies run to run, and a link's close carries its own href. The
 * closing delimiter is deleted first, so the opening one's position is still
 * the one that was read.
 */
export function unwrapRun(
	tr: Transaction,
	markType: MarkType,
	spec: DelimiterSpec,
	run: MarkRun
): { from: number; to: number } {
	const text = tr.doc.textBetween(run.from, run.to)
	const openLength = spec.detectOpen(text)
	const closeLength = spec.detectClose(text)

	tr.removeMark(run.from, run.to, markType)
	if (closeLength > 0) tr.delete(run.to - closeLength, run.to)
	if (openLength > 0) tr.delete(run.from, run.from + openLength)

	return {
		from: run.from,
		to: run.to - openLength - closeLength,
	}
}
