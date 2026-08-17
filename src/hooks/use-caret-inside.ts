import type { NodeViewProps } from '@tiptap/react'
import { useEffect, useState } from 'react'

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
	const [inside, setInside] = useState(false)

	useEffect(() => {
		const update = () => {
			// Guarded on the position rather than on `getPos` itself: a node view
			// ProseMirror has already detached keeps its `getPos` function, which
			// then returns `undefined`. Replacing the document dispatches
			// `selectionUpdate` synchronously, before React runs the dead view's
			// effect cleanup, so this listener does fire - and `nodeAt(undefined)`
			// throws out of the effect and takes the editor down with it.
			const start = typeof getPos === 'function' ? getPos() : undefined
			if (start === undefined) return setInside(false)

			const node = editor.state.doc.nodeAt(start)
			const { from, to } = editor.state.selection

			setInside(
				Boolean(node) &&
					editor.isFocused &&
					from >= start &&
					to <= start + (node?.nodeSize ?? 0)
			)
		}

		// Deliberately not called for the selection the block mounts with. The
		// editor does not autofocus, but a document replaced in place carries its
		// old selection over, and a block that inherits it would open showing
		// source nobody asked to edit.
		editor.on('selectionUpdate', update)
		editor.on('focus', update)
		editor.on('blur', update)

		return () => {
			editor.off('selectionUpdate', update)
			editor.off('focus', update)
			editor.off('blur', update)
		}
	}, [editor, getPos])

	return inside
}
