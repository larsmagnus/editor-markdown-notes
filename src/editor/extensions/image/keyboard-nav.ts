import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Command, EditorState } from '@tiptap/pm/state'
import {
	NodeSelection,
	Plugin,
	PluginKey,
	TextSelection,
} from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'

/** Which way the search goes: forward toward the end of the doc, or back. */
type Direction = 1 | -1

/** The position of the next (or previous) image relative to `from`, or `null`. */
function findAdjacentImagePos(
	doc: ProseMirrorNode,
	from: number,
	dir: Direction
): number | null {
	let found: number | null = null

	doc.descendants((node, pos) => {
		if (node.type.name !== 'image') return
		if (dir > 0 ? pos <= from : pos >= from) return
		if (found === null || (dir > 0 ? pos < found : pos > found)) {
			found = pos
		}
	})

	return found
}

/** A transaction selecting the image at `pos` as a `NodeSelection`, scrolled into view. */
function selectImageTransaction(state: EditorState, pos: number) {
	return state.tr
		.setSelection(NodeSelection.create(state.doc, pos))
		.scrollIntoView()
}

/**
 * Moves selection to the next (or previous) image. Declines once there is no
 * further image, so tabbing out of the last one continues to the page's next
 * focusable element instead of trapping focus.
 */
export function moveToAdjacentImage(dir: Direction): Command {
	return (state, dispatch, view) => {
		const pos = findAdjacentImagePos(state.doc, state.selection.from, dir)
		if (pos === null) return false

		if (dispatch) {
			dispatch(selectImageTransaction(state, pos))
			view?.focus()
		}

		return true
	}
}

/**
 * Where an arrow press would land if it stepped straight onto/over an
 * adjacent image, or `null` if the image isn't the very next thing in that
 * direction. Two ways to be adjacent: sitting directly beside the image in
 * the same parent (ordinary mid-paragraph text), or sitting at the edge of
 * an enclosing node whose own next/previous sibling is the image (exiting a
 * revealed `imageSource` node the caret is inside, back onto the image it
 * belongs to) - `nodeAt` alone only ever sees the first.
 */
function findStepOverTarget(state: EditorState, dir: Direction): number | null {
	const { selection, doc } = state
	if (!selection.empty) return null

	const nodeAtInBounds = (pos: number) =>
		pos >= 0 && pos < doc.content.size ? doc.nodeAt(pos) : null

	const directPos = dir > 0 ? selection.from : selection.from - 1
	if (nodeAtInBounds(directPos)?.type.name === 'image') {
		return dir > 0 ? directPos + 1 : directPos
	}

	const $pos = doc.resolve(selection.from)
	const atEdge =
		dir > 0
			? $pos.parentOffset === $pos.parent.content.size
			: $pos.parentOffset === 0
	if (!atEdge || $pos.depth === 0) return null

	if (dir > 0) {
		const boundary = $pos.after($pos.depth)
		if (nodeAtInBounds(boundary)?.type.name !== 'image') return null
		return boundary + 1
	}

	const boundary = $pos.before($pos.depth)
	if (nodeAtInBounds(boundary - 1)?.type.name !== 'image') return null
	return boundary - 1
}

/**
 * Steps a plain arrow key straight past an adjacent image, as a collapsed
 * caret on its far side, rather than letting the browser's own arrow-key
 * handling reach it.
 *
 * `contenteditable={false}` makes the image a non-editable island; stepping
 * onto one via native arrow-key handling doesn't move a caret there, since
 * there's nowhere inside it for one - it leaves a *Range* selecting the whole
 * atom instead. That's invisible until the very next keystroke, when typing
 * (or another arrow key building on that Range) replaces the selection, and
 * the image is silently deleted. Consuming the keydown ourselves and setting
 * an explicit `TextSelection` past the image is what keeps every arrow press
 * a real, single-character-equivalent caret move - never a stuck caret,
 * never a `NodeSelection` a hard focus would need Tab to leave, and never a
 * Range an ordinary keystroke can eat the image through.
 */
export function createImageStepOverPlugin(): Plugin {
	return new Plugin({
		key: new PluginKey('imageStepOver'),
		props: {
			handleKeyDown(view: EditorView, event: KeyboardEvent) {
				if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
					return false
				}

				const dir: Direction = event.key === 'ArrowRight' ? 1 : -1
				const target = findStepOverTarget(view.state, dir)
				if (target === null) return false

				view.dispatch(
					view.state.tr.setSelection(
						TextSelection.create(view.state.doc, target)
					)
				)
				return true
			},
		},
	})
}
