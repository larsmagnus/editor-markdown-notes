import type { Editor } from '@tiptap/react'
import { useEffect, useRef } from 'react'

import {
	focusNearestStopFromElement,
	focusNearestStopFromPosition,
} from '@/editor/extensions/focus-navigation/nearest-stop'
import { skipToEditorRef } from '@/editor/extensions/focus-navigation/skip-target'

/**
 * Handles two Tab cases ProseMirror's keymap can't reach - both involve
 * real DOM focus on a node view's button, and `handleKeyDown` stops firing
 * once focus leaves `view.dom`. A `document`-level listener doesn't depend
 * on ProseMirror's focus tracking:
 *
 * 1. Entering the editor from outside (toolbar, "Skip to editor") lands on
 *    the true first/last stop - a leading widget's button if it has one,
 *    else the start/end of the body.
 * 2. Leaving a node view's button moves to whichever comes first in
 *    document order: the next button, or a return to plain text.
 *
 * Telling a real Tab-entry apart from a click needs a capture-phase
 * `keydown`/`pointerdown` listener tracking the last Tab's direction
 * (cleared by any other key or pointer interaction), plus checking the
 * `focus` event's `relatedTarget` is outside `view.dom` (`null` for a
 * click, excluding clicks for free).
 *
 * Also publishes `skipToEditorRef`, the one place that knows both the live
 * `Editor` and this search - only while `active`, since the live editor now
 * stays mounted, hidden, behind raw mode (`EditorBody`) rather than
 * unmounting. Left unconditional, "Skip to editor" would keep jumping into
 * the invisible live editor even while raw view is what's on screen.
 */
export function useFocusNavigation(
	editor: Editor | null,
	active: boolean
): void {
	const pendingDirection = useRef<1 | -1 | null>(null)

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			pendingDirection.current =
				event.key === 'Tab' ? (event.shiftKey ? -1 : 1) : null
		}

		function onPointerDown() {
			pendingDirection.current = null
		}

		document.addEventListener('keydown', onKeyDown, { capture: true })
		document.addEventListener('pointerdown', onPointerDown, { capture: true })
		return () => {
			document.removeEventListener('keydown', onKeyDown, { capture: true })
			document.removeEventListener('pointerdown', onPointerDown, {
				capture: true,
			})
		}
	}, [])

	useEffect(() => {
		// Not active: leave `skipToEditorRef` unclaimed, so `skipToEditor()` falls
		// back to the raw textarea instead of jumping into this hidden editor.
		if (!editor || !active) return

		function onFocus({ event }: { event: FocusEvent }) {
			const direction = pendingDirection.current
			if (!direction || !editor) return

			const related = event.relatedTarget
			if (
				!(related instanceof HTMLElement) ||
				editor.view.dom.contains(related)
			) {
				return
			}

			pendingDirection.current = null
			const boundaryPos = direction === 1 ? 0 : editor.state.doc.content.size
			focusNearestStopFromPosition(editor, boundaryPos, direction)
		}

		editor.on('focus', onFocus)
		skipToEditorRef.current = () => focusNearestStopFromPosition(editor, 0, 1)

		return () => {
			editor.off('focus', onFocus)
			skipToEditorRef.current = null
		}
	}, [editor, active])

	useEffect(() => {
		if (!editor) return

		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Tab' || !editor) return

			const activeElement = document.activeElement
			if (!(activeElement instanceof HTMLElement)) return
			if (activeElement === editor.view.dom) return // FocusNavigation's case.
			if (!editor.view.dom.contains(activeElement)) return

			const direction = event.shiftKey ? -1 : 1
			if (focusNearestStopFromElement(editor, activeElement, direction)) {
				event.preventDefault()
				event.stopPropagation() // Else still bubbles to TabIndent on `view.dom`.
			}
		}

		document.addEventListener('keydown', onKeyDown, { capture: true })
		return () =>
			document.removeEventListener('keydown', onKeyDown, { capture: true })
	}, [editor])
}
