import type { NodeViewProps } from '@tiptap/react'

import { revealContainerRange } from '#src/editor/extensions/block-marker/reveal-container-range'
import type { BlockMarkerSpec } from '#src/editor/extensions/block-marker/spec'
import { revealsContainer } from '#src/editor/extensions/syntax-reveal/reveal-ranges'
import { useEditorFlag } from '#src/hooks/use-editor-flag'

// Module-level, so the subscription is not torn down and rebuilt every render.
// `transaction` as well as the selection events: a marker's length can change
// under a caret that never moved, as when an ordered list renumbers.
const EVENTS = ['selectionUpdate', 'transaction', 'focus', 'blur'] as const

type MarkerRevealedProps = Pick<NodeViewProps, 'editor' | 'getPos' | 'node'> & {
	spec: Pick<BlockMarkerSpec, 'markerHost' | 'revealScope'>
	markerLength: number
}

/**
 * Is this node's own marker currently revealed?
 *
 * A node view that draws something *instead of* its marker - a task item's
 * checkbox stands in for `[ ]`, frontmatter's box chrome stands in for its
 * `---` fences - has to react while the real text is showing, or both appear
 * at once. The answer comes from the same overlap test `SyntaxReveal` uses
 * for its decorations, against the same container `revealContainerRange`
 * reports, so the two cannot disagree about what "revealed" means.
 */
export function useMarkerRevealed({
	editor,
	getPos,
	node,
	spec,
	markerLength,
}: MarkerRevealedProps): boolean {
	return useEditorFlag(
		{ editor, getPos },
		(pos) => {
			if (spec.revealScope === 'marker' && markerLength === 0) return false
			if (!editor.isFocused) return false

			const [from, to] = revealContainerRange(
				spec,
				pos,
				node.nodeSize,
				markerLength
			)
			return revealsContainer(editor.state.selection, from, to)
		},
		EVENTS
	)
}
