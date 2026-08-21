import type { ResolvedPos } from '@tiptap/pm/model'
import type { Command, EditorState } from '@tiptap/pm/state'
import { TextSelection } from '@tiptap/pm/state'
import { nextCell, TableMap } from '@tiptap/pm/tables'

import { cellAt, outOfText } from '@/editor/table/cell-selection'

/** Which way the caret is being asked to go. */
type Direction = 1 | -1

type Dispatch = Parameters<Command>[1]

/** Is the caret's cell the last one in the whole table, or the first? */
function atTableCorner($cell: ResolvedPos, dir: Direction): boolean {
	const map = TableMap.get($cell.node(-1))
	const { left, right, top, bottom } = map.findCell($cell.pos - $cell.start(-1))

	return dir > 0
		? right === map.width && bottom === map.height
		: left === 0 && top === 0
}

/**
 * Puts the caret in the block outside the table, if there is one to reach.
 *
 * At either end of the document there is not, and the search for the nearest
 * text position turns around and comes back into the table - which reads as the
 * caret jumping the wrong way. Staying put is the better answer.
 */
function leaveTable(
	state: EditorState,
	dispatch: Dispatch,
	$cell: ResolvedPos,
	dir: Direction
): boolean {
	const outside = dir > 0 ? $cell.after(-1) : $cell.before(-1)
	const caret = TextSelection.near(state.doc.resolve(outside), dir)
	const start = $cell.start(-1)
	const end = start + $cell.node(-1).content.size

	if (!caret.$head.parent.isTextblock) return false
	if (caret.head > start && caret.head < end) return false

	if (dispatch) dispatch(state.tr.setSelection(caret).scrollIntoView())

	return true
}

/**
 * The caret's cell, if the selection is a plain empty text caret sitting
 * inside a table at all - the entry guard both callers below need before
 * asking anything direction-specific about where it can go.
 */
function resolveTableCaret(
	state: EditorState
): { $head: ResolvedPos; $cell: ResolvedPos } | null {
	const { selection } = state
	if (!(selection instanceof TextSelection) || !selection.empty) return null

	const $head = selection.$head
	const $cell = cellAt($head)

	return $cell ? { $head, $cell } : null
}

/**
 * Moves the caret to the cell above or below, in the same column, or out of the
 * table when there is no such row.
 *
 * Without this the vertical arrows walk the cells in document order, so leaving
 * the last line of a cell lands in the one beside it rather than the one under
 * it: a cell here is itself the textblock, and with nothing below the caret
 * inside it the browser falls back to the next position in the document.
 *
 * Declines while there is another line to reach inside the cell.
 */
export function moveCaretToCellBeyond(dir: Direction): Command {
	return (state, dispatch, view) => {
		const at = resolveTableCaret(state)
		if (!at) return false

		// The cell first: `outOfText` asks the view about layout, and every arrow
		// in the document reaches this before it is known to be in a table at all.
		const { $head, $cell } = at

		if (!outOfText($head, 'vert', dir, view)) return false

		const $next = nextCell($cell, 'vert', dir)

		if (!$next) return leaveTable(state, dispatch, $cell, dir)

		// `+ 1` to land inside the cell's text rather than on the cell node.
		const caret = TextSelection.near(state.doc.resolve($next.pos + 1), dir)

		if (dispatch) dispatch(state.tr.setSelection(caret).scrollIntoView())

		return true
	}
}

/**
 * Moves the caret out of the table sideways, to the block after or before it.
 *
 * Arrowing right off the end of the last cell otherwise lands at the end of the
 * block *before* the table: there is no text position after the last cell
 * inside the table, and the search for the nearest one runs backwards.
 */
export function moveCaretPastTable(dir: Direction): Command {
	return (state, dispatch) => {
		const at = resolveTableCaret(state)
		if (!at) return false

		const { $head, $cell } = at

		if (!outOfText($head, 'horiz', dir)) return false
		if (!atTableCorner($cell, dir)) return false

		return leaveTable(state, dispatch, $cell, dir)
	}
}
