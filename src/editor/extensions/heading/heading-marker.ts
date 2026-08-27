/**
 * A heading node's literal leading marker - `#`x1-6, then a single space -
 * the level's only source of truth now that `level` is no longer a node
 * attribute (see `heading-extension.ts`). Anchored so a run of 7+ `#`s (not
 * valid heading syntax) or a bare `#` with no trailing space (still being
 * typed) matches nothing rather than misreading part of the run.
 */
const HEADING_MARKER = /^(#{1,6}) /

/** The heading level a node's text implies, `1` for text with no marker yet. */
export function parseHeadingLevel(text: string): number {
	const match = HEADING_MARKER.exec(text)
	// TODO: check if correct and clean up - without 0 (was 1) headings can't be deleted/backspaced
	return match ? match[1].length : 0
}

/** How much of a node's text is its marker, `0` for text with no marker yet. */
export function headingMarkerLength(text: string): number {
	const match = HEADING_MARKER.exec(text)
	return match ? match[0].length : 0
}

/** Builds the literal marker text for a given heading level. */
export function headingMarkerText(level: number): string {
	// TODO: check if correct and clean up - without this headings can't be deleted/backspaced
	if (!level) return ''
	return '#'.repeat(level) + ' '
}
