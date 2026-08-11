import type { ResolvedPos } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'
import {
	CellSelection,
	deleteCellSelection,
	deleteColumn,
	deleteRow,
	deleteTable,
	nextCell,
} from '@tiptap/pm/tables'
import type { EditorView } from '@tiptap/pm/view'

/** Which way a shift-arrow reaches for the next cell. */
type Direction = 1 | -1

/** Along the row, or down the column. */
type Axis = 'horiz' | 'vert'

/** Is the caret at the near end of its cell's content in this direction? */
function atContentEdge($head: ResolvedPos, dir: Direction): boolean {
	return dir > 0
		? $head.parentOffset === $head.parent.content.size
		: $head.parentOffset === 0
}

/**
 * Has the caret run out of text to move through in this direction?
 *
 * Vertically the document cannot answer this on its own: a cell wraps, so there
 * may be another line to reach well before the cell's last character. That is a
 * question about layout, which is why the view comes along.
 */
export function outOfText(
	$head: ResolvedPos,
	axis: Axis,
	dir: Direction,
	view?: EditorView
): boolean {
	if (atContentEdge($head, dir)) return true

	return axis === 'vert' && !!view?.endOfTextblock(dir > 0 ? 'down' : 'up')
}

/**
 * The cell a position sits in.
 *
 * `prosemirror-tables` has `cellAround` for this, but it starts looking one
 * level above the position, on the assumption that a cell wraps its content in
 * a paragraph. Cells here hold inline content, so the position's own parent is
 * already the cell and that search walks straight past it.
 */
export function cellAt($pos: ResolvedPos): ResolvedPos | null {
	for (let depth = $pos.depth; depth > 0; depth -= 1) {
		const role = $pos.node(depth).type.spec.tableRole

		if (role === 'cell' || role === 'header_cell') {
			return $pos.doc.resolve($pos.before(depth))
		}
	}

	return null
}

/**
 * Extends a caret that has run out of text in its cell into a selection of that
 * cell and its neighbour along `axis`.
 *
 * Declines while there is still text to take, so a shift-arrow goes on
 * extending the text selection first - and vertically, while there is still a
 * line to reach, which is a question about layout rather than the document.
 *
 * Both axes need this. `prosemirror-tables` has its own shift-arrow, but it
 * finds the cell the way `cellAround` does, one level above the position, and
 * so never finds ours.
 */
export function selectCellBeside(axis: Axis, dir: Direction): Command {
	return (state, dispatch, view) => {
		const { selection } = state

		// A cell selection is `prosemirror-tables`' own to extend.
		if (selection instanceof CellSelection) return false

		// The cell first: `outOfText` asks the view about layout, and every
		// shift-arrow in the document reaches this before it is known to be in a
		// table at all.
		const $head = selection.$head
		const $cell = cellAt($head)

		if (!$cell || !outOfText($head, axis, dir, view)) return false

		const $next = nextCell($cell, axis, dir)

		if (!$next) return false

		if (dispatch)
			dispatch(state.tr.setSelection(new CellSelection($cell, $next)))

		return true
	}
}

/**
 * Backspace over selected cells removes whatever the selection covers whole.
 *
 * Selecting part of a row says something about those cells, so they are
 * emptied; selecting all of it says something about the row, so the row goes.
 * Falls through when the selection is an ordinary caret, leaving every other
 * backspace alone.
 */
export const removeCellSelection: Command = (state, dispatch) => {
	const { selection } = state

	if (!(selection instanceof CellSelection)) return false

	const wholeRows = selection.isRowSelection()
	const wholeColumns = selection.isColSelection()

	if (wholeRows && wholeColumns) return deleteTable(state, dispatch)
	if (wholeRows) return deleteRow(state, dispatch)
	if (wholeColumns) return deleteColumn(state, dispatch)

	return deleteCellSelection(state, dispatch)
}
