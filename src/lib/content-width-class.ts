/** The reading measure. A markdown source line is capped at the same count. */
const MEASURE = 'max-w-[65ch]'

/**
 * How wide the document renders.
 *
 * The one answer for both the rendered document and the markdown source, so
 * toggling between them does not reflow the column.
 */
export function contentWidthClassName({
	fullWidth,
	centerContent,
}: {
	fullWidth: boolean
	centerContent: boolean
}): string {
	if (fullWidth) return 'max-w-full'

	return centerContent ? `${MEASURE} mx-auto` : MEASURE
}
