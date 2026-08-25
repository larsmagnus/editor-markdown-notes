import type { NodeViewProps } from '@tiptap/react'

import { useSelectionTouchesNode } from '@/hooks/selection-touches-node'

/**
 * Does the current selection touch this image right now?
 *
 * Deliberately not `useCaretInside`: that also requires `editor.isFocused`,
 * which is exactly wrong here - the image's own controls (the bubble menu's
 * "Edit source" button, `bubble-controls.tsx`) live *outside* the editor's
 * contenteditable region by construction, so clicking one blurs the editor
 * without changing the selection at all. Gating on focus would make the
 * revealed field disappear the instant the button meant to focus it is
 * clicked. Selection alone is what "moving the caret to the start or end"
 * means for an atom with no content of its own to hold a caret in.
 *
 * Arrow-key entry auto-focusing the revealed field, once mounted, is handled
 * by `image-source-focus-request.ts`'s own module-level keydown listener,
 * not here - see its doc comment for why that has to sit outside React's
 * component tree entirely.
 */
export function useImageSelected({
	editor,
	getPos,
}: Pick<NodeViewProps, 'editor' | 'getPos'>): boolean {
	return useSelectionTouchesNode({ editor, getPos }, { requireFocus: false })
}
