import { useEffect } from 'react'

/**
 * Flushes a pending save the moment a view stops being the one on screen.
 *
 * Both editor modes stay mounted at once (`EditorBody`), so switching between
 * them no longer unmounts the one left behind - nothing is left to flush a
 * debounce still in flight when it hides. Without this, a keystroke made just
 * before switching away sits behind a debounce nobody fires until the author
 * types again. A no-op while nothing is pending, including on the initial
 * mount of a view that starts inactive.
 */
export function useFlushOnDeactivate(active: boolean, flush: () => void) {
	useEffect(() => {
		if (active) return
		flush()
	}, [active, flush])
}
