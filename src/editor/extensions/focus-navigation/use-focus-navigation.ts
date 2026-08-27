import type { Editor } from '@tiptap/react'
import { useEffect, useRef } from 'react'

import {
	focusNearestStopFromElement,
	focusNearestStopFromPosition,
} from '@/editor/extensions/focus-navigation/nearest-stop'
import { skipToEditorRef } from '@/editor/extensions/focus-navigation/skip-target'

/**
 * Handles the two Tab cases ProseMirror's keymap cannot reach, both of which
 * involve real DOM focus on a node view's button - `handleKeyDown` stops
 * firing once focus leaves `view.dom`, so this listens on `document`:
 *
 * 1. Entering the editor from outside lands on the true first/last stop - a
 *    leading widget's button if it has one, else the start/end of the body.
 * 2. Leaving a node view's button moves to whichever comes first in document
 *    order: the next button, or a return to plain text.
 *
 * Telling Tab-entry from a click takes a capture-phase listener tracking the
 * last Tab's direction, plus a `relatedTarget` outside `view.dom` - `null` for
 * a click, which excludes clicks for free.
 *
 * Publishing `skipToEditorRef` is gated on `active` because the live editor
 * stays mounted behind raw mode; unconditional, "Skip to editor" would jump
 * into the invisible one.
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
