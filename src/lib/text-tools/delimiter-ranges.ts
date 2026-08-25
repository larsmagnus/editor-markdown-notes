import type { Node as ProseMirrorNode } from 'prosemirror-model'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'

/**
 * Marks whose delimiters (see `delimited-mark-extension.ts`) are real,
 * literal document text rather than synthesized at save time - `**`/`~~`
 * live inside the run they mark, so the whole run can't simply be skipped
 * the way an `IGNORED_MARKS` entry in `document-text.ts` is: the interior is
 * genuine prose the speller and readability checks still need to see, only
 * the two-character fence at each end is syntax.
 */
const DELIMITED_MARKS: Record<string, string> = { bold: '**', strike: '~~' }

/**
 * The document position ranges every delimited mark's opening/closing fence
 * occupies, sorted by position - what `appendProseText` skips over so
 * flattened prose reads `truly`, not `**truly**`, without dropping the run's
 * own content.
 *
 * A run doesn't always carry its delimiters as real text yet - `new Editor({
 * content })` parses a mark straight onto its bare interior, and
 * `ensure-delimiters-plugin.ts` only fixes that up on the next real
 * transaction - so each end is only counted as a delimiter when the run's
 * own text actually starts/ends with it, the same check that plugin makes.
 */
export function delimiterRanges(doc: ProseMirrorNode): [number, number][] {
	const ranges: [number, number][] = []

	for (const [markName, delimiter] of Object.entries(DELIMITED_MARKS)) {
		const markType = doc.type.schema.marks[markName]
		if (!markType) continue

		for (const run of findMarkRuns(doc, markType)) {
			if (run.to - run.from < delimiter.length * 2) continue

			const runText = doc.textBetween(run.from, run.to)
			if (runText.startsWith(delimiter)) {
				ranges.push([run.from, run.from + delimiter.length])
			}
			if (runText.endsWith(delimiter)) {
				ranges.push([run.to - delimiter.length, run.to])
			}
		}
	}

	return ranges.sort((a, b) => a[0] - b[0])
}

/** A run of text and the document position its first character sits at. */
export type TextSlice = {
	/** Offset of this run within the flattened text. */
	offset: number
	length: number
	/** Position of the run's first character in the ProseMirror document. */
	from: number
}

/**
 * Appends a text child's content, skipping any characters that fall inside
 * `exclusions` - document position ranges assumed sorted and, like every
 * position `document-text.ts`'s walk hands out, visited in increasing order,
 * so `cursor` (shared across every call in one `getDocumentText` pass) only
 * ever moves forward through them.
 */
export function appendProseText(
	text: string,
	childText: string,
	from: number,
	exclusions: [number, number][],
	cursor: { index: number },
	slices: TextSlice[]
): string {
	let result = text
	let pos = from
	const end = from + childText.length

	while (pos < end) {
		while (
			cursor.index < exclusions.length &&
			exclusions[cursor.index][1] <= pos
		) {
			cursor.index++
		}

		const next = exclusions[cursor.index]
		if (next && next[0] <= pos) {
			pos = next[1]
			continue
		}

		const segmentEnd = next ? Math.min(end, next[0]) : end
		const segment = childText.slice(pos - from, segmentEnd - from)
		if (segment) {
			slices.push({ offset: result.length, length: segment.length, from: pos })
			result += segment
		}
		pos = segmentEnd
	}

	return result
}
