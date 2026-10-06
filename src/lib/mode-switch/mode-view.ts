/** A selection as character offsets into a mode's own text. */
export type TextRange = {
	anchor: number
	head: number
}

/**
 * One editor mode as a mode switch sees it: a text, a selection in that text,
 * and where any offset of it sits on screen.
 */
export interface ModeView {
	/** Watched for changes while a switch settles. */
	root: HTMLElement
	text: () => string
	selection: () => TextRange
	setSelection: (range: TextRange) => void
	hasFocus: () => boolean
	focus: () => void
	/** Viewport rect of the caret at `offset`, `null` where nothing is laid out. */
	offsetRect: (offset: number) => DOMRect | null
	/** The first offset laid out at or below viewport `y`, `null` where
	 *  there is no text to find. */
	offsetAtY: (y: number) => number | null
}
