/**
 * Turns an offset in the extracted prose back into a place in the markdown file.
 *
 * Its own module because it is the half of `markdown-text.ts` that fails
 * silently: extraction that goes wrong shows up as a missing or nonsense
 * finding, while a position that goes wrong reads as a perfectly plausible
 * line number and sends an agent to edit the wrong part of the file.
 */

/** A run of prose and the offset in the source file its first character sits at. */
export type ProseSlice = { offset: number; length: number; source: number }

export type SourcePosition = { line: number; column: number }

/**
 * Slices for one run of text, aligned to the source it was decoded from.
 *
 * mdast hands back *decoded* text: `\*` in the file arrives as one `*`, and
 * `&amp;` as one `&`. Mapping the value's offsets straight onto the source
 * therefore drifts by one character per escape and four per entity, and every
 * finding after the first one in a paragraph reports a column that reads as
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
): ProseSlice[] {
	if (value.length === source.length) {
		return [{ offset: proseOffset, length: value.length, source: sourceOffset }]
	}

	const slices: ProseSlice[] = []
	let cursor = 0
	let runStart = 0
	let runSource = 0

	const closeRun = (end: number) => {
		if (end <= runStart) return
		slices.push({
			offset: proseOffset + runStart,
			length: end - runStart,
			source: sourceOffset + runSource,
		})
	}

	for (let index = 0; index < value.length; index += 1) {
		if (source[cursor] !== value[index]) {
			closeRun(index)
			// Skip whatever the decode consumed - a backslash, or the body of an
			// entity - until the source lines up with the decoded character again.
			while (cursor < source.length && source[cursor] !== value[index]) {
				cursor += 1
			}
			runStart = index
			runSource = cursor
		}
		cursor += 1
	}

	closeRun(value.length)

	return slices
}

/**
 * Binary searches rather than building a per-character index: this is called
 * once per issue, not once per character of the note.
 */
export function positionMapper(markdown: string, slices: ProseSlice[]) {
	const lineStarts = [0]
	for (let index = 0; index < markdown.length; index += 1) {
		if (markdown[index] === '\n') lineStarts.push(index + 1)
	}

	return (offset: number): SourcePosition => {
		const slice = sliceAt(slices, offset)
		if (!slice) return { line: 1, column: 1 }

		// Clamped because an offset can land in the gap a substituted construct
		// left behind - an inline code span contributes a space to the prose and
		// no slice of its own.
		const within = Math.min(Math.max(offset - slice.offset, 0), slice.length)

		return toPosition(lineStarts, slice.source + within)
	}
}

/** The last slice starting at or before `offset`. */
function sliceAt(slices: ProseSlice[], offset: number): ProseSlice | undefined {
	let low = 0
	let high = slices.length - 1
	let found: ProseSlice | undefined

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

function toPosition(lineStarts: number[], offset: number): SourcePosition {
	let low = 0
	let high = lineStarts.length - 1
	let line = 0

	while (low <= high) {
		const mid = (low + high) >> 1
		const start = lineStarts[mid]
		if (start === undefined) break

		if (start <= offset) {
			line = mid
			low = mid + 1
			continue
		}
		high = mid - 1
	}

	return { line: line + 1, column: offset - (lineStarts[line] ?? 0) + 1 }
}
