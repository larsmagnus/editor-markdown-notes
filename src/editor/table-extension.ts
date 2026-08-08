import Table from '@tiptap/extension-table'
import { getHTMLFromFragment } from '@tiptap/react'
import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Node as ProseMirrorNode } from 'prosemirror-model'

/** `tiptap-markdown` adds `inTable` to prosemirror-markdown's state. */
type TableSerializerState = MarkdownSerializerState & { inTable: boolean }

/**
 * Does this table fit GFM's grid? Merged cells and headers outside the first
 * row have no markdown syntax, so those tables are written out as HTML.
 */
function isGfmTable(table: ProseMirrorNode): boolean {
	const rows = Array.from({ length: table.childCount }, (_, i) =>
		table.child(i)
	)
	const [headerRow, ...bodyRows] = rows
	const cellsOf = (row: ProseMirrorNode) =>
		Array.from({ length: row.childCount }, (_, i) => row.child(i))
	const isSpanned = (cell: ProseMirrorNode) =>
		Number(cell.attrs.colspan) > 1 || Number(cell.attrs.rowspan) > 1

	if (!headerRow) return false

	return (
		cellsOf(headerRow).every(
			(cell) => cell.type.name === 'tableHeader' && !isSpanned(cell)
		) &&
		bodyRows.every((row) =>
			cellsOf(row).every(
				(cell) => cell.type.name !== 'tableHeader' && !isSpanned(cell)
			)
		)
	)
}

/**
 * `tiptap-markdown`'s own table serializer reaches into `cell.firstChild` for
 * the paragraph TipTap normally wraps cell content in. Cells here hold inline
 * content directly, so the cell is rendered instead of its first child.
 */
export const MarkdownTable = Table.configure({ resizable: false }).extend({
	addStorage() {
		return {
			markdown: {
				serialize(state: TableSerializerState, node: ProseMirrorNode) {
					if (!isGfmTable(node)) {
						const schema = node.type.schema
						state.write(
							getHTMLFromFragment(
								schema.topNodeType.create(null, node).content,
								schema
							)
						)
						state.closeBlock(node)
						return
					}

					// Hard breaks serialize differently inside a table row.
					state.inTable = true

					node.forEach((row, _offset, rowIndex) => {
						state.write('| ')
						row.forEach((cell, _cellOffset, cellIndex) => {
							if (cellIndex) state.write(' | ')
							if (cell.textContent.trim()) state.renderInline(cell)
						})
						state.write(' |')
						state.ensureNewLine()

						if (rowIndex === 0) {
							const delimiters = Array.from(
								{ length: row.childCount },
								() => '---'
							)
							state.write(`| ${delimiters.join(' | ')} |`)
							state.ensureNewLine()
						}
					})

					state.closeBlock(node)
					state.inTable = false
				},
				parse: {
					// handled by markdown-it
				},
			},
		}
	},
})
