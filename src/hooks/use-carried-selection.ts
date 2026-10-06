import { useCallback, useLayoutEffect, useRef } from 'react'

import { carrySelection } from '#src/lib/mode-switch/carry-selection'

/**
 * Keeps a focused textarea's caret on the same text when its controlled value
 * is replaced underneath it - React putting the new value in moves the caret
 * to the end.
 *
 * Returns what to call before setting the new value; the caret is put back
 * once `value` commits. A value the textarea already shows commits nothing, so
 * it arms nothing either - left armed, the restore would fire on the next
 * keystroke and pull the caret back to where it was.
 */
export function useCarriedSelection(value: string) {
	const restoreRef = useRef<(() => void) | null>(null)

	useLayoutEffect(() => {
		restoreRef.current?.()
		restoreRef.current = null
	}, [value])

	return useCallback((textarea: HTMLTextAreaElement, next: string) => {
		if (next === textarea.value) return

		restoreRef.current = carrySelection(textarea, textarea.value, next)
	}, [])
}
