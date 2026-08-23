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
 * `Editor` and this search.
 */
export function useFocusNavigation(editor: Editor | null): void {
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
		if (!editor) return

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
	}, [editor])

	useEffect(() => {
		if (!editor) return

		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Tab' || !editor) return

			const active = document.activeElement
			if (!(active instanceof HTMLElement)) return
			if (active === editor.view.dom) return // FocusNavigation's case.
			if (!editor.view.dom.contains(active)) return

			const direction = event.shiftKey ? -1 : 1
			if (focusNearestStopFromElement(editor, active, direction)) {
				event.preventDefault()
				event.stopPropagation() // Else still bubbles to TabIndent on `view.dom`.
			}
		}

		document.addEventListener('keydown', onKeyDown, { capture: true })
		return () =>
			document.removeEventListener('keydown', onKeyDown, { capture: true })
	}, [editor])
}
