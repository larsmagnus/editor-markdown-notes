import type { MarkType, Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Command, Transaction } from '@tiptap/pm/state'

import type {
	DelimiterPair,
	DelimiterSpec,
} from '@/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import type { MarkRun } from '@/editor/extensions/formatting/find-mark-runs'
import {
	wrapRangeWithDelimiter,
	wrapSelectionWithDelimiter,
} from '@/editor/extensions/formatting/wrap-selection-with-delimiter'

/**
 * Strips one run's mark and the delimiter text at its two ends, detected via
 * `spec` rather than assumed fixed-length since inline code's fence varies run
 * to run. Deletes the closing delimiter first, so the opening one's position
 * is still the one that was read.
 */
function unwrapRun(
	tr: Transaction,
	markType: MarkType,
	spec: DelimiterSpec,
	run: MarkRun
): void {
	const text = tr.doc.textBetween(run.from, run.to)
	const openLength = spec.detectOpen(text)
	const closeLength = spec.detectClose(text)

	tr.removeMark(run.from, run.to, markType)
	if (closeLength > 0) tr.delete(run.to - closeLength, run.to)
	if (openLength > 0) tr.delete(run.from, run.from + openLength)
}

/** Whether every piece of text in the range already carries the mark. */
function rangeFullyMarked(
	doc: ProseMirrorNode,
	from: number,
	to: number,
	markType: MarkType
): boolean {
	let allMarked = true
	doc.nodesBetween(from, to, (node) => {
		if (node.isText && !markType.isInSet(node.marks)) allMarked = false
	})
	return allMarked
}

/**
 * Replaces `toggleBold`/`toggleStrike` for a delimited mark. Selecting plain
 * text wraps it in real delimiter text and marks the whole thing, delimiters
 * included; selecting a whole existing run unwraps it; selecting a range that
 * contains already-styled runs absorbs them into one run over the selection,
 * rather than leaving their delimiters stranded inside a new pair as
 * `**plain **bold** more**`.
 *
 * Declines (returns `false`) on an empty selection, and on one that straddles
 * a run - part inside, part outside - which has no single right answer. The
 * caller falls back to the stock `toggleMark` for those, which knows nothing
 * about delimiters; `ensure-delimiters-plugin.ts` is the backstop that keeps
 * mark and delimiter text consistent regardless.
 *
 * Containment is checked against `findMarkRuns` runs, not by asking whether
 * every text node in range carries the mark: a selection spanning two runs
 * split by an inline atom (an image) has the mark on every text node it
 * touches while matching no single run.
 */
export function toggleDelimitedMark(
	markType: MarkType,
	spec: DelimiterSpec,
	wrapDelimiters: DelimiterPair,
	attrs?: Record<string, unknown>
): Command {
	return (state, dispatch) => {
		const { selection } = state
		if (selection.empty) return false

		const { from, to } = selection
		const runs = findMarkRuns(state.doc, markType)
		const enclosing = runs.find((run) => run.from <= from && run.to >= to)

		if (enclosing) {
			if (dispatch) {
				const tr = state.tr
				unwrapRun(tr, markType, spec, enclosing)
				dispatch(tr)
			}
			return true
		}

		const contained = runs.filter((run) => run.from >= from && run.to <= to)
		if (contained.length === 0) {
			if (state.doc.rangeHasMark(from, to, markType)) return false
			return wrapSelectionWithDelimiter(
				markType,
				wrapDelimiters,
				attrs
			)(state, dispatch)
		}

		if (!dispatch) return true

		const tr = state.tr
		for (const run of [...contained].reverse()) {
			unwrapRun(tr, markType, spec, run)
		}

		// Already styled end to end, just as more than one run - the toggle is
		// off, and the unwrapping above is the whole of it.
		if (!rangeFullyMarked(state.doc, from, to, markType)) {
			wrapRangeWithDelimiter(
				tr,
				markType,
				wrapDelimiters,
				tr.mapping.map(from),
				tr.mapping.map(to),
				attrs
			)
		}

		dispatch(tr)
		return true
	}
}
