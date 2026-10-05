/**
 * Stops a pointer press on the editor's own chrome from reaching visimer.
 *
 * Visimer clears the selection on any press outside its canvas, which would
 * disable the very buttons that act on the selection before their click lands.
 * The listener has to be added before visimer adds its own, so it runs first.
 *
 * @returns removes the listener.
 */
export function shieldChromePointerdown(
	frame: HTMLElement,
	canvas: HTMLElement
): () => void {
	function shield(event: PointerEvent) {
		const target = event.target
		if (!(target instanceof Node)) return

		if (frame.contains(target) && !canvas.contains(target)) {
			event.stopImmediatePropagation()
		}
	}

	document.addEventListener('pointerdown', shield, true)
	return () => document.removeEventListener('pointerdown', shield, true)
}
