import type { DocumentText } from '@/lib/text-tools/document-text'

/**
 * Converts an offset in the flattened text back to a document position.
 *
 * Offsets landing in a gap between slices - a block separator, or an inline
 * image - resolve to the end of the preceding slice, so a range never collapses
 * onto the wrong block.
 */
export function offsetToPosition(
	{ slices }: DocumentText,
	offset: number
): number | null {
	if (slices.length === 0) return null

	let low = 0
	let high = slices.length - 1
	let candidate = slices[0]

	while (low <= high) {
		const middle = (low + high) >> 1
		const slice = slices[middle]

		if (slice.offset <= offset) {
			candidate = slice
			low = middle + 1
		} else {
			high = middle - 1
		}
	}

	if (offset < candidate.offset) return null

	const within = Math.min(offset - candidate.offset, candidate.length)
	return candidate.from + within
}
