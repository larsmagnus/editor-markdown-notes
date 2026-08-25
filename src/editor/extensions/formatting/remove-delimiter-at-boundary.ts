import type { MarkType } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'

import type { DelimiterSpec } from '@/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'

/**
 * Deleting right at a run's inner boundary - immediately after its opening
 * delimiter, or immediately before its closing one - removes that whole
 * delimiter and strips the mark from the run it bounded. One keystroke, not
 * a character at a time: the delimiter is only ever fully present or fully
 * absent, so a half-deleted `*bold**` would leave content the reveal engine
 * can't parse back into a clean run.
 *
 * The delimiter's length is detected per run via `spec` rather than passed
 * in fixed, since inline code's fence length varies run to run (the
 * shortest backtick run not already present inside the code itself).
 */
function removeDelimiterAtEdge(
	markType: MarkType,
	spec: DelimiterSpec,
	edge: 'opening' | 'closing'
): Command {
	return (state, dispatch) => {
		const { selection } = state
		if (!selection.empty) return false

		for (const run of findMarkRuns(state.doc, markType)) {
			const runText = state.doc.textBetween(run.from, run.to)
			const length =
				edge === 'opening'
					? spec.detectOpen(runText)
					: spec.detectClose(runText)
			if (length === 0) continue

			const boundary = edge === 'opening' ? run.from + length : run.to - length
			if (boundary !== selection.from) continue

			if (dispatch) {
				const tr = state.tr
				tr.removeMark(run.from, run.to, markType)
				if (edge === 'opening') {
					tr.delete(run.from, run.from + length)
				} else {
					tr.delete(run.to - length, run.to)
				}
				dispatch(tr)
			}
			return true
		}

		return false
	}
}

/** Backspace right after a run's opening delimiter. */
export function removeOpeningDelimiterOnBackspace(
	markType: MarkType,
	spec: DelimiterSpec
): Command {
	return removeDelimiterAtEdge(markType, spec, 'opening')
}

/** Delete right before a run's closing delimiter. */
export function removeClosingDelimiterOnDelete(
	markType: MarkType,
	spec: DelimiterSpec
): Command {
	return removeDelimiterAtEdge(markType, spec, 'closing')
}
