import { Fragment, Slice } from '@tiptap/pm/model'
import type { Schema } from '@tiptap/pm/model'

/**
 * A copied cell range is a slice of loose `tableRow`s left open at both ends,
 * for `prosemirror-tables` to merge into the cells it lands in. Nothing else
 * knows what to do with it: there is no markdown serializer for a bare row, and
 * pasting one outside a table drops it on the floor.
 *
 * Closing it into a table of its own is what makes both work.
 *
 * Returns null when the slice is not a table range, so callers can fall through
 * to the slice they were given.
 */
export function closeTableSlice(slice: Slice, schema: Schema): Slice | null {
	const first = slice.content.firstChild

	if (!first) return null

	if (first.type.spec.tableRole === 'row') {
		return new Slice(
			Fragment.from(schema.nodes.table.create(null, slice.content)),
			0,
			0
		)
	}

	const isOpenTable =
		first.type.name === 'table' &&
		slice.content.childCount === 1 &&
		(slice.openStart > 0 || slice.openEnd > 0)

	return isOpenTable ? new Slice(slice.content, 0, 0) : null
}
