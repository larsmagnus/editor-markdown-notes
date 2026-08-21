import type { Command } from '@tiptap/pm/state'
import { isInTable, selectedRect, TableMap } from '@tiptap/pm/tables'
import type { Node as ProseMirrorNode } from 'prosemirror-model'

/**
 * The alignments GFM can express. `null` is "unaligned", which is also what
 * `@tiptap/extension-table` stores when a cell carries no `text-align`.
 */
export type TableAlign = 'left' | 'center' | 'right' | null

/**
 * The delimiter-row cell each alignment serializes to.
 *
 * A table authored without alignment has `null` throughout and falls through to
 * the plain `---`, so it round-trips byte for byte.
 */
const ALIGN_DELIMITERS: Record<NonNullable<TableAlign>, string> = {
	left: ':---',
	center: ':---:',
	right: '---:',
}

/** The cell's `align` attribute, or null for anything else. */
function alignOf(cell: ProseMirrorNode): TableAlign {
	const align = cell.attrs.align

	if (align === 'left' || align === 'center' || align === 'right') return align

	return null
}

/**
 * The `| :--- | --- | ---: |` line that separates a GFM table's header from its
 * body, and the only place the table's alignment is written.
 *
 * GFM aligns by column while ProseMirror stores `align` per cell - markdown-it
 * puts the style on every cell in the column, so the header row alone is a
 * faithful reading.
 */
export function delimiterRow(headerRow: ProseMirrorNode): string {
	const delimiters = Array.from(
		{ length: headerRow.childCount },
		(_, index) => {
			const align = alignOf(headerRow.child(index))

			return align ? ALIGN_DELIMITERS[align] : '---'
		}
	)

	return `| ${delimiters.join(' | ')} |`
}

/** Sets `align` on every cell of the selected column, header included. */
export const alignColumn =
	(align: TableAlign): Command =>
	(state, dispatch) => {
		if (!isInTable(state)) return false

		const rect = selectedRect(state)
		const map = TableMap.get(rect.table)
		const cells = map.cellsInRect({ ...rect, top: 0, bottom: map.height })

		if (!dispatch) return true

		const { tr } = state
		cells.forEach((pos) => {
			const cell = rect.table.nodeAt(pos)
			if (cell) {
				tr.setNodeMarkup(rect.tableStart + pos, undefined, {
					...cell.attrs,
					align,
				})
			}
		})

		dispatch(tr)

		return true
	}
