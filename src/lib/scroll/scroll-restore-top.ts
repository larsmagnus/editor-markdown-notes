import { createSettleLoop, TAKEOVER_EVENTS } from '@/lib/scroll/scroll-settle'
import type { SettleOptions } from '@/lib/scroll/scroll-settle'

/**
 * Scrolls a container to a remembered offset, and holds it there while the page
 * finishes settling.
 *
 * One assignment at mount is not enough. The document keeps changing height for
 * a while after first paint - images decode, mermaid diagrams render from a lazy
 * import, Shiki highlighting arrives, the lazily-loaded toolbar appears above it
 * all - so an offset set against the half-built page lands short, and content
 * growing above the viewport then carries the position further down through the
 * browser's own scroll anchoring. Left alone, that shift was recorded as the new
 * position and the note crept further down its own page on every reopen.
 *
 * Re-applied on a timer rather than from a `ResizeObserver`, because not every
 * cause is a resize of something there is to observe: the toolbar mounting is a
 * sibling appearing, which moves everything below it without resizing any of it.
 *
 * Holds until the reader takes over or `timeoutMs` passes, whichever is first.
 * Returns its own teardown, which is what a takeover event triggers.
 */
export function scrollRestoreTop(
	container: HTMLElement,
	target: number,
	options: SettleOptions = {}
): () => void {
	// A note that opens at the top needs no holding there, but it does need
	// putting there: standalone, the file selector swaps notes underneath the one
	// scroll container, so an unvisited note would otherwise inherit wherever the
	// last one was left - and record that as its own remembered position.
	if (target <= 0) {
		container.scrollTop = 0
		options.onSettled?.()
		return () => {}
	}

	// What was last put there, and the page it was measured against.
	let appliedTop = -1
	let appliedHeight = -1

	const apply = () => {
		appliedHeight = container.scrollHeight
		appliedTop = Math.min(target, appliedHeight - container.clientHeight)
		container.scrollTop = appliedTop
	}

	return createSettleLoop(
		apply,
		(settle) => {
			/**
			 * Lets go of anything scrolling the page that is neither this function nor
			 * the page growing.
			 *
			 * VSCode's find widget is the case that matters: it lives in VSCode's own
			 * chrome rather than in this document, so scrolling a match into view fires
			 * none of the takeover events above, and the search result would be pulled
			 * back off screen. An unchanged height is what tells that apart from the
			 * scroll anchoring this function exists to undo.
			 */
			const onScroll = () => {
				if (container.scrollTop === appliedTop) return
				if (container.scrollHeight !== appliedHeight) return

				settle()
			}

			container.addEventListener('scroll', onScroll, { passive: true })
			for (const event of TAKEOVER_EVENTS) {
				container.addEventListener(event, settle, { passive: true })
			}

			return () => {
				container.removeEventListener('scroll', onScroll)
				for (const event of TAKEOVER_EVENTS) {
					container.removeEventListener(event, settle)
				}
			}
		},
		options
	)
}
