import type { Editor, NodeViewProps } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'

type EditorEvent = 'selectionUpdate' | 'transaction' | 'focus' | 'blur'

const SELECTION_EVENTS: readonly EditorEvent[] = [
	'selectionUpdate',
	'focus',
	'blur',
]

/**
 * A boolean a node view derives from the editor's current state, recomputed
 * whenever the editor reports one of `events`.
 *
 * The shared body behind every "is this node selected / revealed / being
 * edited" hook. Each differs only in what it computes, never in the
 * subscription or the detached-node-view guard - which is the part that is
 * easy to get subtly wrong.
 *
 * Deliberately does not compute on mount. The editor never autofocuses, but a
 * document replaced in place carries its old selection over, and a view that
 * inherited it would open showing source nobody asked to edit.
 */
export function useEditorFlag(
	{ editor, getPos }: Pick<NodeViewProps, 'editor' | 'getPos'>,
	compute: (pos: number, editor: Editor) => boolean,
	events: readonly EditorEvent[] = SELECTION_EVENTS
): boolean {
	const [flag, setFlag] = useState(false)

	// Held in a ref so the subscription depends only on the editor and the
	// position: every caller defines `compute` inline, and depending on it
	// would tear the listeners down and rebuild them on every render - while
	// capturing it in the effect instead would leave the listener calling a
	// stale closure once anything it reads changes.
	const computeRef = useRef(compute)
	computeRef.current = compute

	useEffect(() => {
		const update = () => {
			// Guarded on the position rather than on `getPos` itself: a node view
			// ProseMirror has already detached keeps its `getPos` function, which
			// then returns `undefined`. Replacing the document dispatches
			// `selectionUpdate` synchronously, before React runs the dead view's
			// effect cleanup, so this listener does fire - and reading the document
			// at `undefined` throws out of the effect, taking the editor with it.
			const pos = typeof getPos === 'function' ? getPos() : undefined
			setFlag(pos === undefined ? false : computeRef.current(pos, editor))
		}

		for (const event of events) editor.on(event, update)

		return () => {
			for (const event of events) editor.off(event, update)
		}
	}, [editor, getPos, events])

	return flag
}
