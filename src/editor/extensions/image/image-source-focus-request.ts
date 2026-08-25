/**
 * A one-shot flag telling `ImageSourceField` whether to claim focus (and at
 * which edge) the moment it mounts - only an ArrowRight/ArrowLeft keypress
 * sets it, so a plain click still leaves the field visible but unfocused,
 * preserving the bubble menu's "Edit source" button as a working second way
 * in (its default `shouldShow` requires `view.hasFocus()`, which stealing
 * focus on every selection would break the instant the image is clicked).
 *
 * Set by a `keydown` listener registered once here, at module scope, rather
 * than inside a React effect anywhere in the image's own component tree:
 * `ImageSourceField`'s mount effect runs as a *child* of `ImageView` (which
 * decides whether the field renders at all), and React commits child effects
 * before parent effects in the same commit - a request set from a
 * `useEffect` reacting to the very same selection change that mounts the
 * field would always arrive one commit too late to be consumed. A listener
 * outside the component tree entirely has no such ordering to fight.
 *
 * Deliberately coarse - "was the *immediately preceding* key an arrow key,
 * with nothing else in between" - rather than checking whether that key
 * specifically entered *this* image: by the time any such check could run,
 * ProseMirror has typically already processed the key and updated its
 * selection, so "the state right now" and "the state before this keypress"
 * are no longer reliably distinguishable from a plain `keydown` listener.
 * The coarse version is still correct, because the only way arrow-key
 * navigation lands the selection on an image *at all* is by moving onto it,
 * and any other key (or a click) clears the flag first.
 */
let pendingEdge: 'start' | 'end' | null = null

if (typeof document !== 'undefined') {
	document.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowRight') pendingEdge = 'start'
		else if (event.key === 'ArrowLeft') pendingEdge = 'end'
		else pendingEdge = null
	})
	document.addEventListener('mousedown', () => {
		pendingEdge = null
	})
}

export function consumeImageSourceFocusRequest(): 'start' | 'end' | null {
	const edge = pendingEdge
	pendingEdge = null
	return edge
}
