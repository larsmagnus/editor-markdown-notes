import type { NodeViewProps } from '@tiptap/react'
import { useEffect, useState } from 'react'

/**
 * Does `editor`'s current selection touch the node at `pos`? A synchronous
 * one-off read - `useSelectionTouchesNode` below is the subscribed version
 * for a component that needs to keep tracking it.
 */
export function selectionTouchesNode(
	editor: NodeViewProps['editor'],
	pos: number
): boolean {
	const node = editor.state.doc.nodeAt(pos)
	const { from, to } = editor.state.selection
	return Boolean(node) && from >= pos && to <= pos + (node?.nodeSize ?? 0)
}

/**
 * Tracks whether the editor's selection touches the node view calling this
 * hook, recomputing on every selection/focus change. `requireFocus` also
 * requires `editor.isFocused` and hides on blur - the right behavior for
 * source revealed inline in editable content (`useCaretInside`), but wrong
 * for a node whose own controls live outside the editor's contenteditable
 * region (`useImageSelected`): clicking such a control blurs the editor
 * without changing the selection, and gating on focus would make the
 * control's target disappear the instant it's clicked.
 */
export function useSelectionTouchesNode(
	{ editor, getPos }: Pick<NodeViewProps, 'editor' | 'getPos'>,
	{ requireFocus }: { requireFocus: boolean }
): boolean {
	const [touches, setTouches] = useState(false)

	useEffect(() => {
		const update = () => {
			// Guarded on the position rather than on `getPos` itself: a node view
			// ProseMirror has already detached keeps its `getPos` function, which
			// then returns `undefined`. Replacing the document dispatches
			// `selectionUpdate` synchronously, before React runs the dead view's
			// effect cleanup, so this listener does fire - and `nodeAt(undefined)`
			// throws out of the effect and takes the editor down with it.
			const start = typeof getPos === 'function' ? getPos() : undefined
			if (start === undefined) return setTouches(false)

			setTouches(
				(!requireFocus || editor.isFocused) &&
					selectionTouchesNode(editor, start)
			)
		}

		// Deliberately not called for the selection the view mounts with. The
		// editor does not autofocus, but a document replaced in place carries its
		// old selection over, and a view that inherits it would open showing
		// source nobody asked to edit.
		editor.on('selectionUpdate', update)
		editor.on('focus', update)
		if (requireFocus) editor.on('blur', update)

		return () => {
			editor.off('selectionUpdate', update)
			editor.off('focus', update)
			if (requireFocus) editor.off('blur', update)
		}
	}, [editor, getPos, requireFocus])

	return touches
}
