import type { MarkType } from '@tiptap/pm/model'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'

import type { DelimiterSpec } from '#src/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '#src/editor/extensions/formatting/find-mark-runs'
import type { MarkRun } from '#src/editor/extensions/formatting/find-mark-runs'
import { unwrapRun } from '#src/editor/extensions/formatting/unwrap-run'

/** Backspace deletes to the caret's left, Delete to its right. */
type Direction = 'backspace' | 'delete'

/** The document range one of a run's two delimiters occupies, if it has one. */
function delimiterRange(
	doc: ProseMirrorNode,
	spec: DelimiterSpec,
	run: MarkRun,
	edge: 'open' | 'close'
): { from: number; to: number } | null {
	const text = doc.textBetween(run.from, run.to)
	const length =
		edge === 'open' ? spec.detectOpen(text) : spec.detectClose(text)
	if (length === 0) return null

	return edge === 'open'
		? { from: run.from, to: run.from + length }
		: { from: run.to - length, to: run.to }
}

/**
 * Does a keystroke in this direction, at this caret, delete a character of
 * that delimiter? Half-open on opposite ends for the two directions, since
 * each takes the character on its own side of the caret.
 */
function deletesInto(
	range: { from: number; to: number },
	caret: number,
	direction: Direction
): boolean {
	return direction === 'backspace'
		? caret > range.from && caret <= range.to
		: caret >= range.from && caret < range.to
}

/**
 * Deleting any character of either delimiter unwraps the whole run - both
 * delimiters and the mark - in one keystroke. Two reasons it cannot be the
 * single character the key asked for. A half-deleted `**` parses back to no
 * clean run, and repair reads that remnant as a delimiter the author removed;
 * and a run left carrying one delimiter serializes as prose reading as half a
 * construct, which markdown-it pairs with whatever follows on the next load.
 *
 * Both edges answer to both directions. Bound one-to-one - Backspace to the
 * opening delimiter, Delete to the closing - the two gestures that actually
 * mean "unformat this" are the two that fall through: backspacing at the end
 * of `_italic_`, and backspacing into a link's `](url)`.
 */
function unwrapRunAtDelimiter(
	markType: MarkType,
	spec: DelimiterSpec,
	direction: Direction
): Command {
	return (state, dispatch) => {
		const { selection } = state
		if (!selection.empty) return false

		for (const run of findMarkRuns(state.doc, markType)) {
			const edges = ['open', 'close'] as const
			const hit = edges.some((edge) => {
				const range = delimiterRange(state.doc, spec, run, edge)
				return range !== null && deletesInto(range, selection.from, direction)
			})
			if (!hit) continue

			if (dispatch) {
				const tr = state.tr
				unwrapRun(tr, markType, spec, run)
				dispatch(tr)
			}
			return true
		}

		return false
	}
}

/** Backspace anywhere inside either of a run's delimiters. */
export function removeDelimiterOnBackspace(
	markType: MarkType,
	spec: DelimiterSpec
): Command {
	return unwrapRunAtDelimiter(markType, spec, 'backspace')
}

/** Delete anywhere inside either of a run's delimiters. */
export function removeDelimiterOnDelete(
	markType: MarkType,
	spec: DelimiterSpec
): Command {
	return unwrapRunAtDelimiter(markType, spec, 'delete')
}
