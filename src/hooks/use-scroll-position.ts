import { useEffect, useRef, useState } from 'react'

import { readScrollTop, writeScrollTop } from '@/lib/scroll-position'
import { scrollRestoreTop } from '@/lib/scroll/scroll-restore-top'
import { hasSearchReveal } from '@/lib/search-reveal'

/**
 * Opens a note where it was last left, and remembers where it is left next.
 *
 * Returns the ref to put on the scrolling element. A note not seen yet this
 * session starts at the top, which is why the editor must not autofocus - a
 * caret placed at either end scrolls itself into view over this.
 */
export function useScrollPosition(fileName: string) {
	const containerRef = useRef<HTMLDivElement>(null)

	// Asked while rendering, because the editor claims the reveal from an effect
	// and a child's effects run before this hook's - asked any later, the answer
	// would always be "no reveal" and the restore would fight it.
	const [revealPending] = useState(hasSearchReveal)

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		// Restoration scrolls the container itself, and does so repeatedly while
		// the document is still growing. Recording those intermediate offsets
		// would overwrite the very target being restored to.
		let restoring = true

		const stopRestoring = revealPending
			? // A note opened from a search result belongs at its match, not where
				// it was last left, so the restore does not start at all rather than
				// racing `useSearchReveal` for the same container. Recording stays
				// suppressed for as long as that reveal could still be scrolling,
				// or the revealed offset becomes the note's remembered position and
				// the next ordinary open lands on the old match.
				//
				// Decided on the reveal existing, not on it landing: whether the
				// text can be found is only known inside the editor, an effect
				// later. So a reveal whose text is not in the document - it spanned
				// markdown syntax - opens the note at the top rather than where it
				// was left. Rare, and the reader was navigating away from that spot
				// anyway.
				suppressRecordingWhileRevealing(() => {
					restoring = false
				})
			: scrollRestoreTop(container, readScrollTop(fileName), {
					onSettled: () => {
						restoring = false
					},
				})

		// Written on every event rather than debounced: a scroll fires at most once
		// per frame, and the panel can be disposed at any moment - VSCode tears the
		// webview down when the tab is backgrounded, without running any teardown
		// here - so there is no reliable later moment to flush a pending write.
		const record = () => {
			if (!restoring) writeScrollTop(fileName, container.scrollTop)
		}

		container.addEventListener('scroll', record, { passive: true })

		return () => {
			stopRestoring()
			container.removeEventListener('scroll', record)
		}
	}, [fileName, revealPending])

	return containerRef
}

/**
 * How long a reveal is given before the reader's scrolling is recorded again.
 *
 * Matches `scrollHoldInView`'s own window, since that is exactly how long the reveal
 * can still be moving the page.
 */
const REVEAL_SETTLE_MS = 3000

/** Waits out a reveal, then hands recording back. Shaped like the restore's
 *  teardown so the caller can treat the two the same way. */
function suppressRecordingWhileRevealing(onSettled: () => void): () => void {
	const timer = setTimeout(onSettled, REVEAL_SETTLE_MS)

	return () => clearTimeout(timer)
}
