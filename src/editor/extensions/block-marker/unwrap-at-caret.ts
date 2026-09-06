import type { Command } from '@tiptap/pm/state'

import { BLOCK_MARKER_SPECS } from '@/editor/extensions/block-marker/specs'

/**
 * Takes apart the construct the caret is in, marker text and all - what a
 * toolbar toggle means when the construct is already on. Routed through the
 * construct's own `unwrap` rather than lifting and then stripping text, so the
 * toggle and the author deleting the marker by hand land on the same result.
 */
export function unwrapConstructAtCaret(nodeTypeName: string): Command {
	return (state, dispatch) => {
		const spec = BLOCK_MARKER_SPECS.find((candidate) =>
			candidate.nodeTypes.includes(nodeTypeName)
		)
		if (!spec) return false

		const { $from } = state.selection
		for (let depth = $from.depth; depth >= 0; depth -= 1) {
			const node = $from.node(depth)
			if (node.type.name !== nodeTypeName) continue

			if (dispatch) {
				const tr = state.tr
				spec.unwrap(tr, {
					spec,
					node,
					pos: $from.before(depth),
					parent: depth > 0 ? $from.node(depth - 1) : null,
					index: depth > 0 ? $from.index(depth - 1) : 0,
					host: {
						node,
						nodeStart: $from.before(depth),
						textStart: $from.before(depth) + 1,
					},
				})
				dispatch(tr)
			}
			return true
		}

		return false
	}
}
