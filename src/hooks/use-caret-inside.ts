import type { NodeViewProps } from '@tiptap/react'

import { useSelectionTouchesNode } from '@/hooks/selection-touches-node'

/**
 * Is the caret inside this node right now?
 *
 * This cannot be answered with a DOM blur: the source sits in the editor's one
 * contenteditable element, so clicking another paragraph moves the caret
 * without anything losing focus. The editor's own selection is the only thing
 * that tracks it - which also means arrowing into a collapsed block reveals its
 * source rather than losing the caret in it.
 */
export function useCaretInside({
	editor,
	getPos,
}: Pick<NodeViewProps, 'editor' | 'getPos'>): boolean {
	return useSelectionTouchesNode({ editor, getPos }, { requireFocus: true })
}
