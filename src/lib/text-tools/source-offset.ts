/**
 * Turns an offset into extracted prose back into a plain character offset in
 * the markdown source it was extracted from.
 *
 * Shared by `src/mcp/source-position.ts` (which turns that offset into a
 * line/column for an agent) and the raw editor's own issue placement (which
 * wants the character offset directly, to underline a range in the textarea).
 * Getting this wrong fails silently: a position that drifts still reads as a
 * plausible line number or textarea range, just the wrong one.
 */

/** A run of prose and the offset in the source file its first character sits at. */
export type SourceSlice = { offset: number; length: number; source: number }

/**
 * Slices for one run of text, aligned to the source it was decoded from.
 *
 * mdast hands back *decoded* text: `\*` in the file arrives as one `*`, and
 * `&amp;` as one `&`. Mapping the value's offsets straight onto the source
 * therefore drifts by one character per escape and four per entity, and every
 * finding after the first one in a paragraph reports a position that reads as
 * perfectly plausible and is wrong.
 *
 * The common case - nothing decoded, so the lengths match - stays one slice.
 * Otherwise the decoded text is walked against its source and a new slice
 * started wherever the two diverge, so each run maps linearly again. The source
 * cursor only ever moves forward, so this stays linear in the length of the run.
 */
export function alignedSlices(
	value: string,
	source: string,
	proseOffset: number,
	sourceOffset: number
): SourceSlice[] {
	if (value.length === source.length) {
		return [{ offset: proseOffset, length: value.length, source: sourceOffset }]
	}

	const slices: SourceSlice[] = []
	let cursor = 0
	let runStart = 0
	let runSource = 0
	let index = 0

	const closeRun = (end: number) => {
		if (end <= runStart) return
		slices.push({
			offset: proseOffset + runStart,
			length: end - runStart,
			source: sourceOffset + runSource,
		})
	}

	while (index < value.length) {
		if (source[cursor] === value[index]) {
			cursor += 1
			index += 1
			continue
		}

		closeRun(index)

		if (source[cursor] === '&') {
			// A character reference decodes to characters that never appear in the
			// source at all (`&mdash;` -> `—`), so scanning for a literal match -
			// what a backslash escape needs - runs off the end of the source
			// instead. Map the whole decoded run to where the reference starts.
			const entityEnd = source.indexOf(';', cursor)
			const after = entityEnd === -1 ? source.length : entityEnd + 1
			let length = 1
			while (
				index + length < value.length &&
				after < source.length &&
				value[index + length] !== source[after]
			) {
				length += 1
			}
			slices.push({
				offset: proseOffset + index,
				length,
				source: sourceOffset + cursor,
			})
			index += length
			cursor = after
		} else {
			// A backslash escape: the escaped character is still literally present
			// right after it, so skip the backslash and resync on that.
			if (source[cursor] === '\\') cursor += 1
			while (cursor < source.length && source[cursor] !== value[index]) {
				cursor += 1
			}
		}

		runStart = index
		runSource = cursor
	}

	closeRun(value.length)

	return slices
}

/** The last slice starting at or before `offset`. */
function sliceAt(
	slices: SourceSlice[],
	offset: number
): SourceSlice | undefined {
	let low = 0
	let high = slices.length - 1
	let found: SourceSlice | undefined

	while (low <= high) {
		const mid = (low + high) >> 1
		const slice = slices[mid]
		if (!slice) break

		if (slice.offset <= offset) {
			found = slice
			low = mid + 1
			continue
		}
		high = mid - 1
	}

	return found ?? slices[0]
}

/**
 * Where an offset into extracted prose sits in the original markdown source,
 * as a plain character offset - `null` only when there is nothing to map.
 *
 * Clamped to its slice's own length, because an offset can land in the gap a
 * substituted construct left behind - an inline code span contributes a space
 * to the prose and no slice of its own.
 */
export function sourceOffsetAt(
	slices: SourceSlice[],
	offset: number
): number | null {
	if (slices.length === 0) return null

	const slice = sliceAt(slices, offset)
	if (!slice) return null

	const within = Math.min(Math.max(offset - slice.offset, 0), slice.length)
	return slice.source + within
}
