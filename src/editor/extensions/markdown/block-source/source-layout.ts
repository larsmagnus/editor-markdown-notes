type SourcePiece = {
	/** `null` for an orphan. */
	id: number | null
	text: string
}

/**
 * The note cut into its top-level pieces, with the exact text between each
 * pair of neighbours - `gaps[i]` precedes `pieces[i]`, and the final entry
 * follows the last piece.
 */
export type SourceLayout = {
	pieces: SourcePiece[]
	gaps: string[]
}

type LineSpan = { id: number; startLine: number; endLine: number }

/** Offset of each line's first character; one past the end for the line after the last. */
function lineStarts(text: string): number[] {
	const starts = [0]
	for (let index = 0; index < text.length; index++) {
		if (text[index] === '\n') starts.push(index + 1)
	}
	starts.push(text.length + 1)
	return starts
}

/** `[startLine, endLine)` as offsets, excluding the newline ending the last line. */
function lineRangeOffsets(
	text: string,
	starts: number[],
	startLine: number,
	endLine: number
): { start: number; end: number } {
	return {
		start: starts[startLine],
		end: Math.min(starts[endLine] - 1, text.length),
	}
}

/** Drops blank lines a block's line map ends on, which belong to the gap after it. */
function trimTrailingBlankLines(lines: string[], span: LineSpan): LineSpan {
	let { endLine } = span
	while (endLine > span.startLine + 1 && lines[endLine - 1].trim() === '') {
		endLine--
	}
	return { ...span, endLine }
}

/** Runs of non-blank lines between `fromLine` and `toLine` that no block claims. */
function orphanLineRuns(
	lines: string[],
	fromLine: number,
	toLine: number
): Array<[number, number]> {
	const runs: Array<[number, number]> = []
	let runStart: number | null = null

	for (let line = fromLine; line <= toLine; line++) {
		const isContent = line < toLine && lines[line].trim() !== ''
		if (isContent && runStart === null) runStart = line
		if (!isContent && runStart !== null) {
			runs.push([runStart, line])
			runStart = null
		}
	}

	return runs
}

/**
 * Cuts `text` into the blocks markdown-it found (`blocks`, as line maps) and
 * whatever lines it found nothing in, keeping every character: joining
 * `gaps[0] + pieces[0] + gaps[1] + ... + gaps[n]` reproduces `text` exactly.
 */
export function buildSourceLayout(
	text: string,
	blocks: Array<{ id: number; map: [number, number] }>
): SourceLayout {
	const lines = text.split('\n')
	const starts = lineStarts(text)
	const spans = blocks
		.map(({ id, map }) =>
			trimTrailingBlankLines(lines, { id, startLine: map[0], endLine: map[1] })
		)
		.sort((a, b) => a.startLine - b.startLine)

	const lineSpans: Array<{
		id: number | null
		startLine: number
		endLine: number
	}> = []
	let cursor = 0
	for (const span of [
		...spans,
		{ id: -1, startLine: lines.length, endLine: lines.length },
	]) {
		for (const [startLine, endLine] of orphanLineRuns(
			lines,
			cursor,
			span.startLine
		)) {
			lineSpans.push({ id: null, startLine, endLine })
		}
		if (span.id !== -1) lineSpans.push(span)
		cursor = Math.max(cursor, span.endLine)
	}

	const pieces: SourcePiece[] = []
	const gaps: string[] = []
	let previousEnd = 0
	for (const span of lineSpans) {
		const { start, end } = lineRangeOffsets(
			text,
			starts,
			span.startLine,
			span.endLine
		)
		gaps.push(text.slice(previousEnd, start))
		pieces.push({ id: span.id, text: text.slice(start, end) })
		previousEnd = end
	}
	gaps.push(text.slice(previousEnd))

	return { pieces, gaps }
}
