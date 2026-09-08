import type { NodeViewProps } from '@tiptap/react'

import { firstParagraphStart } from '#src/editor/extensions/list/list-marker'
import { revealsContainer } from '#src/editor/extensions/syntax-reveal/compute-reveal-decorations'
import { useEditorFlag } from '#src/hooks/use-editor-flag'

// Module-level, so the subscription is not torn down and rebuilt every render.
// `transaction` as well as the selection events: a marker's length can change
// under a caret that never moved, as when an ordered list renumbers.
const EVENTS = ['selectionUpdate', 'transaction', 'focus', 'blur'] as const

type MarkerRevealedProps = Pick<NodeViewProps, 'editor' | 'getPos'> & {
	markerLength: number
}

/**
 * Is this item's own leading marker currently revealed?
 *
 * A node view that draws something *instead of* its marker - a task item's
 * checkbox stands in for `[ ]` - has to step aside while the real text is
 * showing, or both appear at once. The answer comes from the same overlap test
 * `SyntaxReveal` uses for its decorations, against the same container
 * `create-marker-reveal-provider.ts` reports, so the two cannot disagree about
 * what "revealed" means.
 */
export function useMarkerRevealed({
	editor,
	getPos,
	markerLength,
}: MarkerRevealedProps): boolean {
	return useEditorFlag(
		{ editor, getPos },
		(pos) => {
			if (markerLength === 0 || !editor.isFocused) return false

			const start = firstParagraphStart(pos)
			return revealsContainer(
				editor.state.selection,
				start,
				start + markerLength
			)
		},
		EVENTS
	)
}
