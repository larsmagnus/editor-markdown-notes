import type { CSSProperties } from 'react'

import type { ExtensionSettings, ViewOptions } from '#src/shared/messages'

const MIN_DIGITS = 3
/** Matches the `pr-3` between a number and the text it labels. */
const NUMBER_PADDING = '0.75rem'

/** Property the gutter's width is published on, for the margin that makes room. */
const GUTTER_WIDTH_PROPERTY = '--raw-gutter-width'

/**
 * Width the gutter needs for a note of this many lines. The font is
 * monospace, so the digit count alone gives it exactly - no measuring, and it
 * only grows when a note crosses into another digit.
 */
export function rawGutterWidthStyle(lineCount: number): CSSProperties {
	const digits = Math.max(MIN_DIGITS, String(lineCount).length)
	return {
		[GUTTER_WIDTH_PROPERTY]: `calc(${digits}ch + ${NUMBER_PADDING})`,
	} as CSSProperties
}

/**
 * Room for the line-number gutter to hang in. A centered column already has
 * margin to spare; a left-aligned one sits against the page's own padding, so
 * it has to move over by `rawGutterWidthStyle`'s width.
 */
export function rawGutterRoomClassName({
	lineNumbers,
	centerContent,
	fullWidth,
}: Pick<ExtensionSettings, 'lineNumbers' | 'centerContent'> &
	Pick<ViewOptions, 'fullWidth'>): string {
	const centered = centerContent && !fullWidth
	return lineNumbers && !centered ? 'ml-(--raw-gutter-width)' : ''
}
