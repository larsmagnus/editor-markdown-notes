import type { MarkType } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'

/**
 * Deleting right at a run's inner boundary - immediately after its opening
 * delimiter, or immediately before its closing one - removes that whole
 * delimiter and strips the mark from the run it bounded. One keystroke, not
 * a character at a time: the delimiter is only ever fully present or fully
 * absent, so a half-deleted `*bold**` would leave content the reveal engine
 * can't parse back into a clean run.
 */
function removeDelimiterAtEdge(
	markType: MarkType,
	delimiterLength: number,
	edge: 'opening' | 'closing'
): Command {
	return (state, dispatch) => {
		const { selection } = state
		if (!selection.empty) return false

		const run = findMarkRuns(state.doc, markType).find((candidate) =>
			edge === 'opening'
				? candidate.from + delimiterLength === selection.from
				: candidate.to - delimiterLength === selection.from
		)
		if (!run) return false

		if (dispatch) {
			const tr = state.tr
			tr.removeMark(run.from, run.to, markType)
			if (edge === 'opening') {
				tr.delete(run.from, run.from + delimiterLength)
			} else {
				tr.delete(run.to - delimiterLength, run.to)
			}
			dispatch(tr)
		}
		return true
	}
}

/** Backspace right after a run's opening delimiter. */
export function removeOpeningDelimiterOnBackspace(
	markType: MarkType,
	delimiterLength: number
): Command {
	return removeDelimiterAtEdge(markType, delimiterLength, 'opening')
}

/** Delete right before a run's closing delimiter. */
export function removeClosingDelimiterOnDelete(
	markType: MarkType,
	delimiterLength: number
): Command {
	return removeDelimiterAtEdge(markType, delimiterLength, 'closing')
}
