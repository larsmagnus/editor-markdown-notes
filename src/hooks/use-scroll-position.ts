import { useEffect, useRef } from 'react'

import { restoreScrollTop } from '@/lib/restore-scroll-top'
import { readScrollTop, writeScrollTop } from '@/lib/scroll-position'

/**
 * Opens a note where it was last left, and remembers where it is left next.
 *
 * Returns the ref to put on the scrolling element. A note not seen yet this
 * session starts at the top, which is why the editor must not autofocus - a
 * caret placed at either end scrolls itself into view over this.
 */
export function useScrollPosition(fileName: string) {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		// Restoration scrolls the container itself, and does so repeatedly while
		// the document is still growing. Recording those intermediate offsets
		// would overwrite the very target being restored to.
		let restoring = true

		const stopRestoring = restoreScrollTop(container, readScrollTop(fileName), {
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
	}, [fileName])

	return containerRef
}
