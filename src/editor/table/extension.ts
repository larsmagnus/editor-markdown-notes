import { Table } from '@tiptap/extension-table'
import { getHTMLFromFragment } from '@tiptap/react'
import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Node as ProseMirrorNode } from 'prosemirror-model'

import { delimiterRow } from '@/editor/table/alignment'
import { childNodes, hasHeaderRow, isGfmTable } from '@/editor/table/shape'

/** `tiptap-markdown` adds `inTable` to prosemirror-markdown's state. */
export type TableSerializerState = MarkdownSerializerState & {
	inTable: boolean
}

/** The table as raw HTML, for the shapes GFM has no syntax for. */
function writeHtmlTable(
	state: TableSerializerState,
	node: ProseMirrorNode
): void {
	const { schema } = node.type
	state.write(
		getHTMLFromFragment(schema.topNodeType.create(null, node).content, schema)
	)
	state.closeBlock(node)
}

/** One `| a | b |` line, or `|  |  |` when there are no cells to render. */
function writeRow(
	state: TableSerializerState,
	cells: ProseMirrorNode[],
	columns = cells.length
): void {
	state.write('| ')
	for (let index = 0; index < columns; index += 1) {
		if (index) state.write(' | ')
		// `content.size` rather than the text: a cell holding only an image has
		// no text content, and skipping it wrote the image out of the file.
		const cell = cells[index]
		if (cell?.content.size) state.renderInline(cell)
	}
	state.write(' |')
	state.ensureNewLine()
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
					if (!isGfmTable(node)) return writeHtmlTable(state, node)

					// Hard breaks serialize differently inside a table row.
					state.inTable = true

					const rows = childNodes(node)
					const [firstRow] = rows
					const headed = hasHeaderRow(node)

					// GFM has no headerless table, but its header line may be empty -
					// which is what a range of body rows copied out of a table becomes.
					if (headed) writeRow(state, childNodes(firstRow))
					else writeRow(state, [], firstRow.childCount)

					state.write(delimiterRow(firstRow))
					state.ensureNewLine()

					const body = headed ? rows.slice(1) : rows
					body.forEach((row) => writeRow(state, childNodes(row)))

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
