import type { EditorState, Transaction } from '@tiptap/pm/state'
import { canJoin } from '@tiptap/pm/transform'

/** Joins adjacent same-type list nodes that result from structural changes. */
export function mergeAdjacentLists(state: EditorState): Transaction | null {
	const { tr } = state
	const listTypeNames = new Set(['bulletList', 'orderedList', 'taskList'])

	let pos = 0
	for (let i = 0; i < tr.doc.childCount; i++) {
		const node = tr.doc.child(i)
		pos += 1

		if (i < tr.doc.childCount - 1) {
			const next = tr.doc.child(i + 1)
			if (node.type === next.type && listTypeNames.has(node.type.name)) {
				const joinPos = pos + node.content.size
				if (canJoin(tr.doc, joinPos)) {
					tr.join(joinPos)
					return mergeAdjacentLists({ ...state, doc: tr.doc })
				}
			}
		}

		pos += node.content.size + 1
	}

	return tr.docChanged ? tr : null
}
