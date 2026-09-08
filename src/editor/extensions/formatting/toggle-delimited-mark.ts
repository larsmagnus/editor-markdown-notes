import type { MarkType, Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'
import { TextSelection } from '@tiptap/pm/state'

import type {
	DelimiterPair,
	DelimiterSpec,
} from '#src/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '#src/editor/extensions/formatting/find-mark-runs'
import { unwrapRun } from '#src/editor/extensions/formatting/unwrap-run'
import {
	wrapRangeWithDelimiter,
	wrapSelectionWithDelimiter,
} from '#src/editor/extensions/formatting/wrap-selection-with-delimiter'

/**
 * Toggling with nothing selected, which is how most styled text gets written:
 * press the shortcut, then type. Both delimiters go down and the caret lands
 * between them, so what follows is typed *inside* the run.
 *
 * A stored mark cannot do this. The closing delimiter is real mark-carrying
 * text and the mark is deliberately not inclusive, so a stored mark reaches
 * only the first character typed - `**w**orld`. With the closing delimiter
 * already in front of the caret, every character goes in with the mark on both
 * sides of it.
 *
 * Inside an existing run the toggle means off, and takes that run apart -
 * including the empty pair a previous press just put down.
 */
function toggleDelimitedMarkAtCaret(
	markType: MarkType,
	spec: DelimiterSpec,
	pair: DelimiterPair,
	attrs?: Record<string, unknown>
): Command {
	return (state, dispatch) => {
		const { from } = state.selection
		// Strictly inside, so a caret resting against a run's outer edge starts a
		// new one rather than unwrapping the neighbour.
		const enclosing = findMarkRuns(state.doc, markType).find(
			(run) => run.from < from && run.to > from
		)

		if (!dispatch) return true

		const tr = state.tr
		if (enclosing) {
			unwrapRun(tr, markType, spec, enclosing)
		} else {
			wrapRangeWithDelimiter(tr, markType, pair, from, from, attrs)
			tr.setSelection(TextSelection.create(tr.doc, from + pair.open.length))
		}
		dispatch(tr)
		return true
	}
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
 * With nothing selected it puts down an empty pair and leaves the caret inside
 * it, so typing continues into the run (see `toggleDelimitedMarkAtCaret`).
 *
 * Declines (returns `false`) only on a selection that straddles a run - part
 * inside, part outside - which has no single right answer. The
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
		if (selection.empty) {
			return toggleDelimitedMarkAtCaret(
				markType,
				spec,
				wrapDelimiters,
				attrs
			)(state, dispatch)
		}

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
