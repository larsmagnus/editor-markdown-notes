import type { RefObject } from 'react'
import { useLayoutEffect } from 'react'

import type { RawModeElements } from '#src/lib/mode-switch/raw-mode-view'

/**
 * Hands raw mode's textarea and its mirror to `elementsRef`, which is where
 * `EditorBody` reads this view's caret and its on-screen position from to
 * carry both across a mode switch.
 */
export function useRawModeElements(
	elementsRef: RefObject<RawModeElements | null> | undefined,
	textareaRef: RefObject<HTMLTextAreaElement | null>,
	overlayRef: RefObject<HTMLElement | null>
) {
	useLayoutEffect(() => {
		if (!elementsRef) return

		const textarea = textareaRef.current
		const overlay = overlayRef.current
		elementsRef.current = textarea && overlay ? { textarea, overlay } : null
	}, [elementsRef, textareaRef, overlayRef])
}
