import type { MarkType } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { wrapSelectionWithDelimiter } from '@/editor/extensions/formatting/wrap-selection-with-delimiter'

function rangeFullyHasMark(
	state: Parameters<Command>[0],
	from: number,
	to: number,
	markType: MarkType
): boolean {
	let fully = true
	state.doc.nodesBetween(from, to, (node) => {
		if (node.isText && !markType.isInSet(node.marks)) fully = false
	})
	return fully
}

/**
 * Replaces `toggleBold`/`toggleStrike` for a fixed-delimiter mark: selecting
 * plain text wraps it in real delimiter text and marks the whole thing,
 * delimiters included (`wrap-selection-with-delimiter.ts`); selecting a
 * whole existing run unwraps it - strips the mark and deletes both
 * delimiters, which now sit at the run's own two ends.
 *
 * Declines (returns `false`) on an empty selection or a selection that only
 * partially overlaps a run - the caller falls back to the stock
 * `toggleMark` command for those, which is exactly what `setMark`/
 * `unsetMark` already do with no delimiter awareness. That fallback can
 * leave a run's delimiters out of sync with its mark for a selection this
 * command declines to handle itself; `ensure-delimiters-plugin.ts` is the
 * backstop that keeps the invariant true regardless.
 */
export function toggleDelimitedMark(
	markType: MarkType,
	delimiter: string
): Command {
	return (state, dispatch) => {
		const { selection } = state
		if (selection.empty) return false

		const { from, to } = selection

		if (rangeFullyHasMark(state, from, to, markType)) {
			const run = findMarkRuns(state.doc, markType).find(
				(candidate) => candidate.from <= from && candidate.to >= to
			)
			if (!run) return false

			if (dispatch) {
				const tr = state.tr
				tr.removeMark(run.from, run.to, markType)
				tr.delete(run.to - delimiter.length, run.to)
				tr.delete(run.from, run.from + delimiter.length)
				dispatch(tr)
			}
			return true
		}

		if (state.doc.rangeHasMark(from, to, markType)) return false // mixed selection

		return wrapSelectionWithDelimiter(markType, delimiter)(state, dispatch)
	}
}
