import type { MarkType } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'

import type { DelimiterSpec } from '@/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'

/**
 * Deleting anywhere *inside* a run's delimiter - not just right at its
 * trailing edge - removes that whole delimiter and strips the mark from the
 * run it bounded. One keystroke, not a character at a time: the delimiter is
 * only ever fully present or fully absent, so a half-deleted `*bold**` (from
 * a Backspace landing between the two opening `*`s, say) would leave content
 * the reveal engine can't parse back into a clean run - `ensure-delimiters-
 * plugin.ts`'s repair step reads that remnant as "missing" and inserts a
 * fresh delimiter next to it instead of replacing it in place, the same
 * duplication bug class `list-marker-backspace-extension.ts` fixes for list
 * markers.
 *
 * The delimiter's length is detected per run via `spec` rather than passed
 * in fixed, since inline code's fence length varies run to run (the
 * shortest backtick run not already present inside the code itself).
 */
function removeDelimiterAtEdge(
	markType: MarkType,
	spec: DelimiterSpec,
	edge: 'opening' | 'closing',
	direction: 'backspace' | 'delete'
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

			const delimiterFrom = edge === 'opening' ? run.from : run.to - length
			const delimiterTo = delimiterFrom + length

			// Backspace deletes the character to the caret's left, Delete the one
			// to its right - so "caret inside this delimiter" means a half-open
			// range on opposite ends for the two directions.
			const inside =
				direction === 'backspace'
					? selection.from > delimiterFrom && selection.from <= delimiterTo
					: selection.from >= delimiterFrom && selection.from < delimiterTo
			if (!inside) continue

			if (dispatch) {
				const tr = state.tr
				tr.removeMark(run.from, run.to, markType)
				tr.delete(delimiterFrom, delimiterTo)
				dispatch(tr)
			}
			return true
		}

		return false
	}
}

/**
 * Backspace anywhere inside a run's opening delimiter - not just right after
 * its full length, but also between its own characters (e.g. between the
 * two `*` of `**`).
 */
export function removeOpeningDelimiterOnBackspace(
	markType: MarkType,
	spec: DelimiterSpec
): Command {
	return removeDelimiterAtEdge(markType, spec, 'opening', 'backspace')
}

/** Delete anywhere inside a run's closing delimiter. */
export function removeClosingDelimiterOnDelete(
	markType: MarkType,
	spec: DelimiterSpec
): Command {
	return removeDelimiterAtEdge(markType, spec, 'closing', 'delete')
}
