import { createSettleLoop, TAKEOVER_EVENTS } from '@/lib/scroll/scroll-settle'
import type { SettleOptions } from '@/lib/scroll/scroll-settle'

/**
 * Scrolls an element to the middle of the viewport, and keeps it there while the
 * page finishes settling.
 *
 * The counterpart to `scrollRestoreTop`, and re-applied on a timer for the same
 * reason: images decode, mermaid renders from a lazy import, Shiki highlighting
 * arrives, and the lazily-loaded toolbar appears above it all, so anything
 * scrolled to against the half-built page has moved by the time it is built.
 *
 * Where the two differ is what they hold. `scrollRestoreTop` holds an *offset*,
 * which is all a remembered position ever was. This holds an *element*, so
 * content growing above it is followed rather than fought - re-measured on every
 * tick through the element itself.
 *
 * Takeover is watched on `window` rather than on a scroll container, because the
 * element decides which ancestor scrolls and this need not know which one that
 * was.
 */
export function scrollHoldInView(
	element: () => Element | null,
	options: SettleOptions = {}
): () => void {
	const apply = () => {
		// Re-read every tick: a node view remounting, or the document being rebuilt
		// around incoming frontmatter, replaces the element behind our back.
		element()?.scrollIntoView({ block: 'center', inline: 'nearest' })
	}

	return createSettleLoop(
		apply,
		(settle) => {
			// Captured, so a takeover inside the editor is seen before anything there
			// can stop it propagating.
			for (const event of TAKEOVER_EVENTS) {
				window.addEventListener(event, settle, { passive: true, capture: true })
			}

			return () => {
				for (const event of TAKEOVER_EVENTS) {
					window.removeEventListener(event, settle, true)
				}
			}
		},
		options
	)
}
