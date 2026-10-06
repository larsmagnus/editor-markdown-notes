import { createOffsetMap } from '#src/lib/mode-switch/align-offsets'
import type { ViewAnchor } from '#src/lib/mode-switch/capture-view-anchor'
import type { ModeView } from '#src/lib/mode-switch/mode-view'
import { observeChanges } from '#src/lib/mode-switch/observe-changes'
import {
	createSettleLoop,
	settleOnForeignScroll,
	settleOnWindowTakeover,
} from '#src/lib/scroll/scroll-settle'

/**
 * Puts `anchor` into the mode now on screen, and holds it there while the page
 * settles.
 *
 * Re-mapped whenever that mode's text changes, not just once: the leaving
 * mode flushes its last keystrokes on the way out, and they reach this one a
 * render or two after it is already showing. Watched with observers as well
 * as `createSettleLoop`'s timer, so that catch-up - and any layout shift from
 * a mermaid render or an image - is corrected before it paints.
 */
export function holdViewAnchor(
	anchor: ViewAnchor,
	view: ModeView,
	container: HTMLElement
): () => void {
	let mappedText: string | null = null
	let target = anchor.offset
	const applied = { top: -1, height: -1 }

	const remap = () => {
		const text = view.text()
		if (text === mappedText) return
		mappedText = text

		const map = createOffsetMap(anchor.text, text)
		target = anchor.offset === null ? null : map(anchor.offset)
		view.setSelection({
			anchor: map(anchor.selection.anchor),
			head: map(anchor.selection.head),
		})
	}

	const apply = () => {
		remap()
		const rect = target === null ? null : laidOutRect(view, target)
		scrollToAnchor(anchor, rect, container)
		applied.top = container.scrollTop
		applied.height = container.scrollHeight
	}

	// The selection has to be in place before focusing, or focus restores the
	// arriving mode's old one; the loop's own first tick does the scrolling.
	remap()
	if (anchor.wasFocused) view.focus()

	return createSettleLoop(apply, (settle) => {
		const observers = observeChanges(view.root, apply)
		const detachForeignScroll = settleOnForeignScroll(
			container,
			() => applied,
			settle
		)
		const detachTakeover = settleOnWindowTakeover(settle)

		return () => {
			observers.disconnect()
			detachForeignScroll()
			detachTakeover()
		}
	})
}

/** Scrolls `container` so `rect` sits back where the anchor was captured. A
 *  missing rect - text that is not laid out - leaves the scroll alone. */
function scrollToAnchor(
	anchor: ViewAnchor,
	rect: DOMRect | null,
	container: HTMLElement
) {
	if (anchor.atTop) {
		container.scrollTop = 0
		return
	}
	if (!rect) return

	const containerTop = container.getBoundingClientRect().top
	container.scrollTop += rect.top - (containerTop + anchor.viewportY)
}

/** How many lines back to look for laid-out text before giving up. */
const MAX_LINES_BACK = 50

/**
 * The rect of `offset`, or of the nearest line start above it that has one.
 *
 * Text can map to where nothing is laid out - a diagram's source behind its
 * rendering, collapsed frontmatter - and pinning the closest visible line
 * above keeps the reader near it rather than leaving the scroll measured
 * against the other mode's layout.
 */
function laidOutRect(view: ModeView, offset: number): DOMRect | null {
	const text = view.text()
	let candidate = offset

	for (let tries = 0; tries < MAX_LINES_BACK; tries += 1) {
		const rect = view.offsetRect(candidate)
		if (rect) return rect
		if (candidate === 0) return null

		candidate = text.lastIndexOf('\n', candidate - 2) + 1
	}
	return null
}
