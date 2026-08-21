import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Command, EditorState } from '@tiptap/pm/state'
import { NodeSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/react'

/** Which way the search goes: forward toward the end of the doc, or back. */
type Direction = 1 | -1

/** The id `ImageBubbleControls` renders its toolbar `div` under. */
export const IMAGE_TOOLBAR_ID = 'image-toolbar'

/**
 * The position of the next (or previous) image relative to `from`, or `null`
 * if there is none - the doc has finitely many images, so a linear scan is
 * cheap and needs no cache invalidation as the doc changes underneath it.
 */
function findAdjacentImagePos(
	doc: ProseMirrorNode,
	from: number,
	dir: Direction
): number | null {
	let found: number | null = null

	doc.descendants((node, pos) => {
		if (node.type.name !== 'image') return
		if (dir > 0 ? pos <= from : pos >= from) return
		// The first (or, going backward, last) match in document order wins.
		if (found === null || (dir > 0 ? pos < found : pos > found)) {
			found = pos
		}
	})

	return found
}

function isImageSelected(state: EditorState): boolean {
	return (
		state.selection instanceof NodeSelection &&
		state.selection.node.type.name === 'image'
	)
}

/**
 * Moves selection to the next (or previous) image in the doc, focusing the
 * editor itself rather than the image's DOM node.
 *
 * `view.hasFocus()` - which the bubble menu's default `shouldShow` keys off
 * - is a strict `activeElement === view.dom` check, so focusing the `<img>`
 * directly would hide the menu the same instant it selects the image; a real
 * mouse click never hits this because a `contenteditable="false"` leaf isn't
 * a click focus target in the first place. `view.focus()` both re-establishes
 * that and syncs the DOM selection to the new `NodeSelection`, so the image
 * still renders as selected.
 *
 * Declines - leaving `Tab`/`Shift-Tab` to the browser's default focus
 * movement - once there is no further image to reach, which is what lets
 * tabbing out of the last image continue to whatever the page's next real
 * focusable element is instead of trapping focus inside the editor.
 */
export function moveToAdjacentImage(dir: Direction): Command {
	return (state, dispatch, view) => {
		const pos = findAdjacentImagePos(state.doc, state.selection.from, dir)
		if (pos === null) return false

		if (dispatch) {
			dispatch(
				state.tr
					.setSelection(NodeSelection.create(state.doc, pos))
					.scrollIntoView()
			)
			view?.focus()
		}

		return true
	}
}

/**
 * Moves DOM focus into the selected image's bubble menu, entering its
 * toolbar the same way `Tab` would move into any other composite widget.
 * Declines unless an image is currently selected, so plain arrow-key caret
 * movement is untouched everywhere else.
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
 * Where `Tab`/`Shift-Tab` go when pressed from inside the toolbar.
 *
 * Always handles the key itself rather than falling through to the browser's
 * native tab order, which would otherwise land wherever the bubble menu's
 * portal happens to sit in the DOM - often nowhere focusable at all, since
 * portals are commonly appended at the very end of `body`. `Shift-Tab`
 * returns to the image the toolbar belongs to, the composite's point of
 * entry; plain `Tab` continues on to the next image, or - once there is no
 * further image - back into the document, the same place a `Tab` press
 * declined by `moveToAdjacentImage` would have left the caret.
 */
export function exitImageToolbar(editor: Editor, backward: boolean): void {
	if (backward) {
		// Same reasoning as `moveToAdjacentImage`: focus the editor, not the
		// `<img>` - the selection is already the image, nothing to change there.
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
