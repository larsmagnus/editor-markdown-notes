import { isInTable, selectionCell, TableMap } from '@tiptap/pm/tables'
import type { Editor } from '@tiptap/react'

/** A point in the overlay's own coordinate space. */
type Point = { left: number; top: number }

/** Where one axis' handle goes, and which of that axis' lines it points at. */
type TableAxisAnchor = {
	/** The row or column the caret is in. */
	index: number
	/** How many rows or columns the table has. */
	count: number
	/** The handle's own position, centred on that row or column. */
	handle: Point
}

export type TableAnchor = {
	/** The table the caret is in, for hit-testing a drag against its cells. */
	table: HTMLTableElement
	/** The overlay's own viewport position, for anything measured mid-drag. */
	origin: Point
	/** The table, in overlay coordinates. */
	tableBox: Point & { width: number; height: number }
	/** Keyed by axis so a handle can read its own half with `anchor[axis]`. */
	row: TableAxisAnchor
	column: TableAxisAnchor
}

/** The cell element the caret sits in, and the table around it. */
function elementsAt(editor: Editor, cellPos: number) {
	const cell = editor.view.nodeDOM(cellPos)

	if (!(cell instanceof HTMLTableCellElement)) return null

	const table = cell.closest('table')

	return table ? { cell, table } : null
}

/**
 * Where the table handles belong, in `overlay`'s coordinates, or null when the
 * caret is not in a table.
 *
 * Measured off the live cell elements rather than positioned by floating-ui:
 * the handles hang off a table that is already laid out, so a rectangle is the
 * whole answer - and unlike floating-ui, `getBoundingClientRect` is something
 * a test environment without layout can still return.
 */
export function measureTableAnchor(
	editor: Editor,
	overlay: HTMLElement | null
): TableAnchor | null {
	if (!overlay || !isInTable(editor.state)) return null

	const $cell = selectionCell(editor.state)
	const elements = elementsAt(editor, $cell.pos)

	if (!elements) return null

	const map = TableMap.get($cell.node(-1))
	const { top, left } = map.findCell($cell.pos - $cell.start(-1))

	const origin = overlay.getBoundingClientRect()
	const tableBox = elements.table.getBoundingClientRect()
	const cellBox = elements.cell.getBoundingClientRect()

	return {
		table: elements.table,
		origin: { left: origin.left, top: origin.top },
		tableBox: {
			left: tableBox.left - origin.left,
			top: tableBox.top - origin.top,
			width: tableBox.width,
			height: tableBox.height,
		},
		// Both handles straddle their edge of the table, so they read as a pair.
		row: {
			index: top,
			count: map.height,
			handle: {
				left: tableBox.left - origin.left,
				top: cellBox.top + cellBox.height / 2 - origin.top,
			},
		},
		column: {
			index: left,
			count: map.width,
			handle: {
				left: cellBox.left + cellBox.width / 2 - origin.left,
				top: tableBox.top - origin.top,
			},
		},
	}
}
