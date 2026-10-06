import DiffMatchPatch, { DIFF_DELETE, DIFF_INSERT } from 'diff-match-patch'
import type { Diff } from 'diff-match-patch'

/**
 * Long enough for any note to finish aligning, short enough that a pathological
 * pair of texts cannot stall a mode switch. Past it the diff degrades to a
 * coarser one, which is still a usable best effort.
 */
const DIFF_TIMEOUT_SECONDS = 0.25

/**
 * Builds a function carrying a character offset in `from` to the matching one
 * in `to`.
 *
 * Aligned by diff because no source map exists between the rendered document
 * and its markdown. The two texts are mostly the same characters - syntax is
 * real text in the live editor - so what differs (escapes, indentation, blank
 * lines, image syntax) is exactly what a diff steps over.
 */
export function createOffsetMap(
	from: string,
	to: string
): (offset: number) => number {
	const dmp = new DiffMatchPatch()
	dmp.Diff_Timeout = DIFF_TIMEOUT_SECONDS
	const diffs = dmp.diff_main(from, to, true)

	return (offset) => {
		if (to.length === 0) return 0

		return mapThroughDiffs(diffs, Math.min(Math.max(offset, 0), from.length))
	}
}

/**
 * `diff_xIndex`, biased for a caret rather than a patch.
 *
 * An offset on the seam between matched text and inserted text belongs with
 * the matched text: at the start of the run that follows when there is one -
 * a caret opening a block lands after the source's blank line, not on it -
 * otherwise at the end of the run before, so a caret ending the note stays
 * against its last word rather than past a trailing newline.
 */
function mapThroughDiffs(diffs: Diff[], offset: number): number {
	let fromIndex = 0
	let toIndex = 0
	let endOfPreviousRun: number | null = null

	for (const [operation, text] of diffs) {
		const fromLength = operation === DIFF_INSERT ? 0 : text.length
		const toLength = operation === DIFF_DELETE ? 0 : text.length
		const isInside = fromIndex <= offset && offset < fromIndex + fromLength

		if (isInside) {
			return operation === DIFF_DELETE
				? toIndex
				: toIndex + (offset - fromIndex)
		}
		if (operation !== DIFF_INSERT && offset === fromIndex + fromLength) {
			endOfPreviousRun = toIndex + toLength
		}

		fromIndex += fromLength
		toIndex += toLength
	}

	return endOfPreviousRun ?? toIndex
}
