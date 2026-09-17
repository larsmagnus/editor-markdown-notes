import { TextSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/react'

import {
	buttonComesFirst,
	domPointAdjacentTo,
	nearestTextBoundary,
	nearestTextPosition,
} from '#src/editor/extensions/focus-navigation/focus-stop-geometry'
import { findFocusableInDirection } from '#src/editor/extensions/focus-navigation/focusable-elements'
import type { FocusDirection } from '#src/editor/extensions/focus-navigation/focusable-elements'
import { skipHeadingMarker } from '#src/editor/extensions/focus-navigation/skip-heading-marker'

/**
 * Places the caret at `pos` (or the nearest real text position) and gives
 * the editor DOM focus, synchronously.
 *
 * `pos` can land in a gap between two block siblings - e.g. right after a
 * leading widget closes - and TipTap's `focus(pos)` accepts that gap as a
 * valid selection, so inserting text there wraps it in a stray paragraph.
 * `TextSelection.near` finds a real position instead.
 *
 * Uses `view.focus()` directly, not `editor.commands.focus()`: that defers
 * to `requestAnimationFrame`, leaving `document.activeElement` stale for a
 * Tab press that follows immediately.
 */
function focusAtPosition(
	editor: Editor,
	pos: number,
	direction: FocusDirection
): void {
	editor.commands.command(({ tr, dispatch }) => {
		if (dispatch) {
			const target = skipHeadingMarker(tr.doc, pos, direction)
			tr.setSelection(TextSelection.near(tr.doc.resolve(target), direction))
		}
		return true
	})
	editor.view.focus()
}

/**
 * Moves focus to whichever comes first in document order: the next
 * focusable element, or a return to plain text - from a document position
 * rather than an element, for entering the editor from outside it.
 *
 * This is what makes a leading widget's buttons reachable ahead of the
 * body without knowing the widget by name: they simply sit earlier in the
 * DOM than the text that follows.
 */
export function focusNearestStopFromPosition(
	editor: Editor,
	pos: number,
	direction: FocusDirection
): boolean {
	const domPoint = editor.view.domAtPos(pos)
	return focusNearestStop(editor, domPoint, pos, direction)
}

/** Same decision as `focusNearestStopFromPosition`, but for leaving
 *  `element` (a node view's button): the next button, possibly still in
 *  the same widget, or a return to the text just past it. */
export function focusNearestStopFromElement(
	editor: Editor,
	element: Element,
	direction: FocusDirection
): boolean {
	const buttonDomPoint = domPointAdjacentTo(element, direction)
	const textBoundaryPos = nearestTextBoundary(editor, element, direction)
	return focusNearestStop(editor, buttonDomPoint, textBoundaryPos, direction)
}

function focusNearestStop(
	editor: Editor,
	buttonDomPoint: { node: Node; offset: number },
	textBoundaryPos: number,
	direction: FocusDirection
): boolean {
	const buttonTarget = findFocusableInDirection(buttonDomPoint, direction)
	const textPos = nearestTextPosition(editor, textBoundaryPos, direction)

	if (buttonTarget && textPos !== null) {
		if (buttonComesFirst(editor, buttonTarget, textPos, direction)) {
			buttonTarget.focus()
		} else {
			focusAtPosition(editor, textPos, direction)
		}
		return true
	}

	if (buttonTarget) {
		buttonTarget.focus()
		return true
	}

	if (textPos !== null) {
		focusAtPosition(editor, textPos, direction)
		return true
	}

	return false
}
