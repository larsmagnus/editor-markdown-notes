import { NodeSelection } from '@tiptap/pm/state'
import type { NodeViewProps } from '@tiptap/react'

import { useEditorFlag } from '#src/hooks/use-editor-flag'

/**
 * Is the caret (or a click, or arrowing between images) sitting right next to
 * this image - the "soft focus" that reveals its toolbar and draws the same
 * ring `.ProseMirror-selectednode` gets, without ever making the image the
 * actual `NodeSelection`. `createImageStepOverPlugin` (`keyboard-nav.ts`)
 * keeps a plain arrow press landing here a real, collapsed caret rather than
 * a `NodeSelection` a hard focus would need Tab to leave.
 *
 * Deliberately not gated on `editor.isFocused`, unlike `useCaretInside`: the
 * toolbar's own buttons live outside the contenteditable region, so clicking
 * one blurs the editor without changing the selection, and gating on focus
 * would hide the toolbar the instant the button meant to keep it open is
 * clicked.
 */
export function useImageCaretAdjacent({
	editor,
	getPos,
}: Pick<NodeViewProps, 'editor' | 'getPos'>): boolean {
	return useEditorFlag({ editor, getPos }, (pos) => {
		const node = editor.state.doc.nodeAt(pos)
		if (!node) return false

		const { selection } = editor.state
		if (selection instanceof NodeSelection) return selection.from === pos

		return (
			selection.empty &&
			(selection.from === pos || selection.from === pos + node.nodeSize)
		)
	})
}
