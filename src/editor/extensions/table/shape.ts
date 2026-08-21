import type { Node as ProseMirrorNode } from 'prosemirror-model'

/** A node's children as an array - the rows of a table, the cells of a row. */
export function childNodes(node: ProseMirrorNode): ProseMirrorNode[] {
	return Array.from({ length: node.childCount }, (_, index) =>
		node.child(index)
	)
}

/** Merged cells have no markdown syntax at all. */
function isSpanned(cell: ProseMirrorNode): boolean {
	return Number(cell.attrs.colspan) > 1 || Number(cell.attrs.rowspan) > 1
}

export function isHeaderCell(cell: ProseMirrorNode): boolean {
	return cell.type.name === 'tableHeader'
}

/** Is the first row a header row? A range copied out of a table has none. */
export function hasHeaderRow(table: ProseMirrorNode): boolean {
	const [headerRow] = childNodes(table)

	return !!headerRow && childNodes(headerRow).every(isHeaderCell)
}

/**
 * Every cell of a row is a header cell, or none is.
 *
 * A row of both is what pasted HTML can produce, and GFM's delimiter line makes
 * the whole first row the header or none of it - so a mixed row can only be
 * written by demoting half of it.
 */
function hasUniformCellTypes(row: ProseMirrorNode): boolean {
	const cells = childNodes(row)

	return cells.every(isHeaderCell) || !cells.some(isHeaderCell)
}

/**
 * Does this table fit GFM's grid? Merged cells, headers below the first row,
 * and a first row of mixed cell types have no markdown syntax, so those tables
 * are written out as HTML.
 *
 * A table with no header row at all does fit: GFM demands the header line but
 * lets it be empty, which is what the serializer writes. That keeps a
 * body-row selection copying as a table rather than as an HTML blob.
 */
export function isGfmTable(table: ProseMirrorNode): boolean {
	const [headerRow, ...bodyRows] = childNodes(table)

	if (!headerRow) return false

	return (
		hasUniformCellTypes(headerRow) &&
		childNodes(headerRow).every((cell) => !isSpanned(cell)) &&
		bodyRows.every((row) =>
			childNodes(row).every((cell) => !isHeaderCell(cell) && !isSpanned(cell))
		)
	)
}
