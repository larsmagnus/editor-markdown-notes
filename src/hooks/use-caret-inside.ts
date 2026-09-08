import type { NodeViewProps } from '@tiptap/react'

import { useEditorFlag } from '#src/hooks/use-editor-flag'

/**
 * Is the caret inside this node right now?
 *
 * This cannot be answered with a DOM blur: the source sits in the editor's one
 * contenteditable element, so clicking another paragraph moves the caret
 * without anything losing focus. The editor's own selection is the only thing
 * that tracks it - which also means arrowing into a collapsed block reveals its
 * source rather than losing the caret in it.
 *
 * Requires the editor to be focused, so source revealed inline in editable
 * content hides on blur. A node whose controls live *outside* the
 * contenteditable region needs the opposite (`use-image-selected.ts`): clicking
 * such a control blurs the editor without moving the selection.
 */
export function useCaretInside({
	editor,
	getPos,
}: Pick<NodeViewProps, 'editor' | 'getPos'>): boolean {
	return useEditorFlag({ editor, getPos }, (pos) => {
		const node = editor.state.doc.nodeAt(pos)
		if (!node || !editor.isFocused) return false

		const { from, to } = editor.state.selection
		return from >= pos && to <= pos + node.nodeSize
	})
}
