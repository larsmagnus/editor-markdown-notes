import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import { canJoin, Mapping } from '@tiptap/pm/transform'

import { anyDocChanged } from '#src/editor/extensions/transaction-filters'

const LIST_TYPE_NAMES = new Set(['bulletList', 'orderedList', 'taskList'])

/** Whether two sibling nodes are lists of the same kind. */
function isSameKindOfList(
	before: ProseMirrorNode | null | undefined,
	after: ProseMirrorNode | null | undefined
): boolean {
	if (!before || !after) return false
	return before.type === after.type && LIST_TYPE_NAMES.has(before.type.name)
}

/** Every position in `doc` where a list ends and a list of the same kind begins. */
function sameKindListBoundaries(doc: ProseMirrorNode): number[] {
	const boundaries: number[] = []
	const collect = (parent: ProseMirrorNode, contentStart: number) => {
		parent.forEach((child, offset, index) => {
			if (index === 0) return
			if (!isSameKindOfList(parent.child(index - 1), child)) return
			boundaries.push(contentStart + offset)
		})
	}

	collect(doc, 0)
	doc.descendants((node, pos) => {
		if (node.isTextblock) return false
		collect(node, pos + 1)
		return true
	})
	return boundaries
}

/**
 * Joins two lists of the same kind that this batch made adjacent by deleting
 * what separated them, so the note saves as one list rather than two split by
 * a blank line.
 *
 * Only a deletion counts: markdown also has lists that are adjacent on
 * purpose (a changed bullet character starts a new one), and loading a note
 * must not rewrite those.
 */
export function mergeAdjacentLists(
	transactions: readonly Transaction[],
	oldState: EditorState,
	newState: EditorState
): Transaction | null {
	if (!anyDocChanged(transactions)) return null

	const forwards = new Mapping(
		transactions.flatMap((transaction) => transaction.mapping.maps)
	)
	const backwards = forwards.invert()

	const createdByDeletion = (boundary: number) => {
		const from = backwards.map(boundary, -1)
		const to = backwards.map(boundary, 1)
		if (from >= to) return false
		// A boundary inside inserted content also maps back to a span.
		const collapsed =
			forwards.map(from, 1) === boundary && forwards.map(to, -1) === boundary
		if (!collapsed) return false

		return isSameKindOfList(
			oldState.doc.resolve(from).nodeBefore,
			oldState.doc.resolve(to).nodeAfter
		)
	}

	const { tr } = newState
	sameKindListBoundaries(newState.doc)
		.filter(createdByDeletion)
		.sort((a, b) => b - a)
		.forEach((boundary) => {
			if (canJoin(tr.doc, boundary)) tr.join(boundary)
		})

	return tr.docChanged ? tr : null
}
