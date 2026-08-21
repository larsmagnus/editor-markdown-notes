import type { Node as ProseMirrorNode, NodeType } from '@tiptap/pm/model'
import type { EditorState, Transaction } from '@tiptap/pm/state'

import { childNodes, isHeaderCell } from '@/editor/extensions/table/shape'

/**
 * Keeps a table's header row at the top, where GFM's delimiter line puts it.
 *
 * `prosemirror-tables` builds an inserted row from the *reference* row's types,
 * so "Add row above" from the header row makes plain cells at row 0 and leaves
 * the header sitting at row 1. Nothing rejects that shape, but `isGfmTable`
 * does, and the next auto-save rewrites the whole table as an HTML blob.
 *
 * Enforced as an invariant rather than fixed at the call site: a row drag
 * across the header reaches the same shape, and so would anything added later.
 */

/** The first row whose cells are all header cells, or -1 for a headerless table. */
function headerRowIndex(table: ProseMirrorNode): number {
	return childNodes(table).findIndex(
		(row) => row.childCount > 0 && childNodes(row).every(isHeaderCell)
	)
}

/** Rewrites every cell of one row to `type`, keeping its attributes. */
function retypeRow(
	tr: Transaction,
	rowPos: number,
	row: ProseMirrorNode,
	type: NodeType
): void {
	row.forEach((cell, offset) => {
		tr.setNodeMarkup(rowPos + 1 + offset, type, cell.attrs)
	})
}

/**
 * Swaps a header row that has drifted below the top back into the first row,
 * or null when every table already has its header where it belongs.
 */
export function keepHeaderInFirstRow(state: EditorState): Transaction | null {
	const { tr } = state
	const header = state.schema.nodes.tableHeader
	const cell = state.schema.nodes.tableCell

	state.doc.descendants((node, pos) => {
		if (node.type.spec.tableRole !== 'table') return true

		const displaced = headerRowIndex(node)

		if (displaced <= 0) return false

		node.forEach((row, offset, index) => {
			if (index === 0) retypeRow(tr, pos + 1 + offset, row, header)
			if (index === displaced) retypeRow(tr, pos + 1 + offset, row, cell)
		})

		return false
	})

	return tr.docChanged ? tr : null
}
