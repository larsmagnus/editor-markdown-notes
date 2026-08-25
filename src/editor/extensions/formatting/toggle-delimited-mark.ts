import type { MarkType } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'

import type {
	DelimiterPair,
	DelimiterSpec,
} from '@/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { wrapSelectionWithDelimiter } from '@/editor/extensions/formatting/wrap-selection-with-delimiter'

/**
 * Replaces `toggleBold`/`toggleStrike` for a delimited mark: selecting plain
 * text wraps it in real delimiter text and marks the whole thing, delimiters
 * included (`wrap-selection-with-delimiter.ts`, using `wrapDelimiters`);
 * selecting a whole existing run unwraps it - strips the mark and deletes
 * both delimiters, which now sit at the run's own two ends, detected via
 * `spec` rather than assumed fixed-length since inline code's fence varies
 * run to run.
 *
 * Declines (returns `false`) on an empty selection or a selection that only
 * partially overlaps a run - the caller falls back to the stock
 * `toggleMark` command for those, which is exactly what `setMark`/
 * `unsetMark` already do with no delimiter awareness. That fallback can
 * leave a run's delimiters out of sync with its mark for a selection this
 * command declines to handle itself; `ensure-delimiters-plugin.ts` is the
 * backstop that keeps the invariant true regardless.
 *
 * "Whole existing run" is checked by finding one `findMarkRuns` run that
 * contains the selection outright, not by asking whether every text node in
 * range carries the mark - a selection spanning two runs split by a
 * non-text inline atom (an image) can have the mark on every text node it
 * touches while matching no single run, and must fall through to the
 * mixed-selection decline below, the same as a selection straddling two
 * runs of unrelated marked text would.
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
		const run = findMarkRuns(state.doc, markType).find(
			(candidate) => candidate.from <= from && candidate.to >= to
		)

		if (run) {
			if (dispatch) {
				const runText = state.doc.textBetween(run.from, run.to)
				const openLength = spec.detectOpen(runText)
				const closeLength = spec.detectClose(runText)
				const tr = state.tr
				tr.removeMark(run.from, run.to, markType)
				if (closeLength > 0) tr.delete(run.to - closeLength, run.to)
				if (openLength > 0) tr.delete(run.from, run.from + openLength)
				dispatch(tr)
			}
			return true
		}

		if (state.doc.rangeHasMark(from, to, markType)) return false // mixed selection

		return wrapSelectionWithDelimiter(
			markType,
			wrapDelimiters,
			attrs
		)(state, dispatch)
	}
}
