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
 * Shared by `scrollHoldInView` and `scrollRestoreTop`, which differ only in
 * what `apply` does and what counts as a takeover - a plain document listener
 * for one, a container-scoped one plus an external-scroll check for the
 * other. `attachTakeover` receives the loop's own `settle` so a caller's
 * listener can end the loop, and returns its own teardown for `settle` to run
 * once, whichever end of the loop happens first.
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
