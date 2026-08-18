type HoldInViewOptions = {
	/** How long the element is held centred before the reader owns the page. */
	timeoutMs?: number
	/** Called once nothing more will be re-applied, however that came about. */
	onSettled?: () => void
}

const DEFAULT_TIMEOUT_MS = 3000
const REAPPLY_INTERVAL_MS = 100

/** Anything meaning the reader has taken over and must not be fought. */
const TAKEOVER_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const

/**
 * Scrolls an element to the middle of the viewport, and keeps it there while the
 * page finishes settling.
 *
 * The counterpart to `restoreScrollTop`, and re-applied on a timer for the same
 * reason: images decode, mermaid renders from a lazy import, Shiki highlighting
 * arrives, and the lazily-loaded toolbar appears above it all, so anything
 * scrolled to against the half-built page has moved by the time it is built.
 *
 * Where the two differ is what they hold. `restoreScrollTop` holds an *offset*,
 * which is all a remembered position ever was. This holds an *element*, so
 * content growing above it is followed rather than fought - re-measured on every
 * tick through the element itself.
 *
 * Takeover is watched on `window` rather than on a scroll container, because the
 * element decides which ancestor scrolls and this need not know which one that
 * was.
 */
export function holdInView(
	element: () => Element | null,
	{ timeoutMs = DEFAULT_TIMEOUT_MS, onSettled }: HoldInViewOptions = {}
): () => void {
	let settled = false

	const settle = () => {
		if (settled) return
		settled = true

		clearInterval(interval)
		clearTimeout(timer)
		for (const event of TAKEOVER_EVENTS) {
			window.removeEventListener(event, settle, true)
		}

		onSettled?.()
	}

	const apply = () => {
		// Re-read every tick: a node view remounting, or the document being rebuilt
		// around incoming frontmatter, replaces the element behind our back.
		element()?.scrollIntoView({ block: 'center', inline: 'nearest' })
	}

	const interval = setInterval(apply, REAPPLY_INTERVAL_MS)
	const timer = setTimeout(settle, timeoutMs)

	// Captured, so a takeover inside the editor is seen before anything there can
	// stop it propagating.
	for (const event of TAKEOVER_EVENTS) {
		window.addEventListener(event, settle, { passive: true, capture: true })
	}

	apply()

	return settle
}
