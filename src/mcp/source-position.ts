import type { SourceSlice } from '#src/lib/text-tools/source-offset'
import { sourceOffsetAt } from '#src/lib/text-tools/source-offset'

/**
 * Turns an offset in the extracted prose back into a line/column in the
 * markdown file, for an agent to act on.
 *
 * Its own module because it is the half of `markdown-text.ts` that fails
 * silently: extraction that goes wrong shows up as a missing or nonsense
 * finding, while a position that goes wrong reads as a perfectly plausible
 * line number and sends an agent to edit the wrong part of the file. The
 * character-offset mapping itself lives in `#src/lib/text-tools/source-offset`,
 * shared with the raw editor's own issue placement.
 */

export type SourcePosition = { line: number; column: number }

/**
 * Binary searches rather than building a per-character index: this is called
 * once per issue, not once per character of the note.
 */
export function positionMapper(markdown: string, slices: SourceSlice[]) {
	const lineStarts = [0]
	for (let index = 0; index < markdown.length; index += 1) {
		if (markdown[index] === '\n') lineStarts.push(index + 1)
	}

	return (offset: number): SourcePosition => {
		const sourceOffset = sourceOffsetAt(slices, offset)
		if (sourceOffset === null) return { line: 1, column: 1 }

		return toPosition(lineStarts, sourceOffset)
	}
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
