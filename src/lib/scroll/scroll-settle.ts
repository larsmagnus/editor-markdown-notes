const DEFAULT_TIMEOUT_MS = 3000
const REAPPLY_INTERVAL_MS = 100

/** Anything meaning the reader has taken over and must not be fought. */
export const TAKEOVER_EVENTS = [
	'wheel',
	'touchstart',
	'keydown',
	'mousedown',
] as const

export type SettleOptions = {
	/** How long the reapply loop runs before the reader owns the page. */
	timeoutMs?: number
	/** Called once nothing more will be re-applied, however that came about. */
	onSettled?: () => void
}

/**
 * Runs `apply` immediately and then on an interval until the reader takes
 * over or `timeoutMs` passes, whichever is first.
 *
 * `attachTakeover` is handed the loop's own `settle`, so its listeners can end
 * the loop, and returns the teardown `settle` runs once, whichever end comes
 * first.
 *
 * Returns `settle` itself, which is what callers use as their own teardown.
 */
export function createSettleLoop(
	apply: () => void,
	attachTakeover: (settle: () => void) => () => void,
	{ timeoutMs = DEFAULT_TIMEOUT_MS, onSettled }: SettleOptions = {}
): () => void {
	let settled = false

	const settle = () => {
		if (settled) return
		settled = true

		clearInterval(interval)
		clearTimeout(timer)
		detachTakeover()

		onSettled?.()
	}

	const interval = setInterval(apply, REAPPLY_INTERVAL_MS)
	const timer = setTimeout(settle, timeoutMs)
	const detachTakeover = attachTakeover(settle)

	apply()

	return settle
}

/**
 * Ends a loop on a takeover anywhere in the page. Captured, so a takeover
 * inside the editor is seen before anything there can stop it propagating.
 */
export function settleOnWindowTakeover(settle: () => void): () => void {
	for (const event of TAKEOVER_EVENTS) {
		window.addEventListener(event, settle, { passive: true, capture: true })
	}

	return () => {
		for (const event of TAKEOVER_EVENTS) {
			window.removeEventListener(event, settle, true)
		}
	}
}

/** The scroll position a loop last put its container at, and the page height
 *  it was measured against. */
export type AppliedScroll = {
	top: number
	height: number
}

/**
 * Ends a loop on anything scrolling `container` that is neither the loop itself
 * nor the page growing.
 *
 * VSCode's find widget is the case that matters: it lives in VSCode's own
 * chrome rather than in this document, so scrolling a match into view fires
 * none of the takeover events, and the search result would be pulled back off
 * screen. An unchanged height is what tells that apart from the scroll
 * anchoring a loop exists to undo.
 */
export function settleOnForeignScroll(
	container: HTMLElement,
	applied: () => AppliedScroll,
	settle: () => void
): () => void {
	const onScroll = () => {
		const { top, height } = applied()
		if (container.scrollTop === top) return
		if (container.scrollHeight !== height) return

		settle()
	}

	container.addEventListener('scroll', onScroll, { passive: true })

	return () => container.removeEventListener('scroll', onScroll)
}
