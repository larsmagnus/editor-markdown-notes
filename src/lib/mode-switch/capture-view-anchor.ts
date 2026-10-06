import type { ModeView, TextRange } from '#src/lib/mode-switch/mode-view'

/** What a mode switch carries from the mode leaving the screen to the one arriving. */
export type ViewAnchor = {
	/** The leaving mode's text, which every offset here is measured in. */
	text: string
	selection: TextRange
	wasFocused: boolean
	/** The text pinned in place across the switch, `null` when nothing on
	 *  screen could be found to pin. */
	offset: number | null
	/** Where `offset` sat, measured from the scroll container's top edge. */
	viewportY: number
	/** Scrolled to the very top with no caret in view, which stays the top. */
	atTop: boolean
}

/**
 * Reads where the reader is in the mode about to be hidden.
 *
 * The caret is what gets pinned when it is on screen - it is where the reader
 * is looking - and otherwise the first text below the sticky toolbar.
 */
export function captureViewAnchor(
	view: ModeView,
	container: HTMLElement
): ViewAnchor {
	const band = visibleBand(container)
	const selection = view.selection()

	const caretInView = [selection.head, selection.anchor].find((offset) => {
		const rect = view.offsetRect(offset)
		return rect !== null && rect.top >= band.top && rect.bottom <= band.bottom
	})
	const offset = caretInView ?? view.offsetAtY(band.top + 1)
	const top = (offset !== null && view.offsetRect(offset)?.top) || band.top

	return {
		text: view.text(),
		selection,
		wasFocused: view.hasFocus(),
		offset,
		viewportY: top - container.getBoundingClientRect().top,
		atTop: caretInView === undefined && container.scrollTop <= 0,
	}
}

/** The viewport band the reader can actually see: the scroll container, less
 *  the sticky toolbar laid over its top. */
function visibleBand(container: HTMLElement) {
	const { top, bottom } = container.getBoundingClientRect()
	const toolbar = container.querySelector(':scope > [role="toolbar"]')
	const toolbarBottom = toolbar?.getBoundingClientRect().bottom ?? top

	return { top: Math.max(top, toolbarBottom), bottom }
}
