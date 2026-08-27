import { NodeSelection } from '@tiptap/pm/state'
import type { NodeViewProps } from '@tiptap/react'

import { useEditorFlag } from '@/hooks/use-editor-flag'

// Module-level, so the subscription is not torn down and rebuilt every render.
const EVENTS = ['selectionUpdate', 'focus'] as const

/**
 * Is this image the selected node right now?
 *
 * A bare caret never counts, however close it sits. An image is an *inline*
 * atom, so the positions either side of it are ordinary caret positions in the
 * same paragraph; a range test counted a caret merely next to the image as
 * being on it, which opened the source field a keypress early and left the
 * editor drawing its own caret alongside the field's.
 *
 * Deliberately not gated on `editor.isFocused`, unlike `useCaretInside`: the
 * image's own controls (the bubble menu's "Edit source" button) live outside
 * the contenteditable region, so clicking one blurs the editor without changing
 * the selection, and gating on focus would make the field vanish the instant
 * the button meant to focus it is clicked.
 */
export function useImageSelected({
	editor,
	getPos,
}: Pick<NodeViewProps, 'editor' | 'getPos'>): boolean {
	return useEditorFlag(
		{ editor, getPos },
		(pos) => {
			const { selection } = editor.state
			if (selection instanceof NodeSelection) return selection.from === pos

			const node = editor.state.doc.nodeAt(pos)
			if (!node || selection.empty) return false
			return selection.from <= pos && selection.to >= pos + node.nodeSize
		},
		EVENTS
	)
}
