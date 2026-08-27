import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Command, EditorState } from '@tiptap/pm/state'
import { NodeSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/react'

/** Which way the search goes: forward toward the end of the doc, or back. */
type Direction = 1 | -1

/** The id `ImageBubbleControls` renders its toolbar `div` under. */
export const IMAGE_TOOLBAR_ID = 'image-toolbar'

/** The id `image-view.tsx` renders its revealed source `input` under. */
export const IMAGE_SOURCE_FIELD_ID = 'image-source-field'

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

function isImageSelected(state: EditorState): boolean {
	return (
		state.selection instanceof NodeSelection &&
		state.selection.node.type.name === 'image'
	)
}

/**
 * Moves selection to the next (or previous) image, focusing the editor itself
 * rather than the `<img>`: the bubble menu's `shouldShow` is a strict
 * `activeElement === view.dom` check, which focusing a descendant fails.
 *
 * Declines once there is no further image, so tabbing out of the last one
 * continues to the page's next focusable element instead of trapping focus.
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
 * Moves DOM focus into the selected image's bubble menu, the way `Tab` enters
 * any composite widget. Declines unless an image is selected, leaving plain
 * caret movement untouched.
 */
export function focusImageToolbar(): Command {
	return (state) => {
		if (!isImageSelected(state)) return false

		const firstButton = document
			.getElementById(IMAGE_TOOLBAR_ID)
			?.querySelector('button')

		if (!(firstButton instanceof HTMLElement)) return false

		firstButton.focus()
		return true
	}
}

/**
 * Steps the caret onto an adjacent image, selecting the node itself.
 *
 * Both edges of an *inline* atom are ordinary caret positions inside the same
 * paragraph, so ProseMirror's own arrow handling leaves a text caret beside
 * the image that says nothing about being on it - and the editor draws that
 * caret while the source field draws its own. Consuming the key matters too:
 * left to fall through, the now-focused field handles the same press and moves
 * its caret one character in from the edge it should have landed on.
 */
export function enterAdjacentImage(dir: Direction): Command {
	return (state, dispatch) => {
		const { selection } = state
		if (!selection.empty) return false

		// The node the caret steps over: ahead of it, or behind it going back.
		const pos = dir > 0 ? selection.from : selection.from - 1
		if (state.doc.nodeAt(pos)?.type.name !== 'image') return false

		if (dispatch) {
			// Before dispatching: ProseMirror updates the view synchronously, so the
			// field can mount and consume this before `dispatch` returns.
			setImageSourceEntryEdge(dir > 0 ? 'start' : 'end')
			dispatch(selectImageTransaction(state, pos))
		}
		return true
	}
}

/**
 * Which end of the revealed source text the caret lands on, for the field to
 * consume as it mounts. A module-level handoff rather than a prop: the field
 * mounts as a child of the view deciding whether it renders at all, and React
 * commits child effects first, so a prop would arrive a commit too late.
 */
let pendingEntryEdge: 'start' | 'end' | null = null

function setImageSourceEntryEdge(edge: 'start' | 'end'): void {
	pendingEntryEdge = edge
}

/** Takes the pending entry edge, clearing it. */
export function consumeImageSourceEntryEdge(): 'start' | 'end' | null {
	const edge = pendingEntryEdge
	pendingEntryEdge = null
	return edge
}

/**
 * Moves DOM focus into the selected image's source field, which selecting the
 * image has already rendered. Also what keeps `Backspace` on a selected image
 * editing its source rather than deleting the node.
 */
export function focusImageSourceField(): Command {
	return (state) => {
		if (!isImageSelected(state)) return false

		const field = document.getElementById(IMAGE_SOURCE_FIELD_ID)
		if (!(field instanceof HTMLInputElement)) return false

		field.focus()
		field.scrollIntoView({ block: 'nearest' })
		return true
	}
}

/**
 * Where `Tab`/`Shift-Tab` go from inside the toolbar. Never falls through to
 * the native tab order, which would land wherever the bubble menu's portal
 * sits in the DOM - usually the end of `body`, often nothing focusable at all.
 */
export function exitImageToolbar(editor: Editor, backward: boolean): void {
	if (backward) {
		if (isImageSelected(editor.state)) editor.view.focus()
		return
	}

	const movedToNextImage = moveToAdjacentImage(1)(
		editor.state,
		editor.view.dispatch,
		editor.view
	)

	if (!movedToNextImage) editor.view.dom.focus()
}
