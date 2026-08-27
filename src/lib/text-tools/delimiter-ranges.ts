import type { Node as ProseMirrorNode } from 'prosemirror-model'

import type { DelimiterSpec } from '@/editor/extensions/formatting/delimiter-spec'
import { fixedDelimiter } from '@/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { italicDelimiterSpec } from '@/editor/extensions/italic/italic-delimiter-spec'
import { linkDelimiterSpec } from '@/editor/extensions/link/link-delimiter-spec'

/**
 * Marks whose delimiters (see `delimited-mark-extension.ts`) are real,
 * literal document text rather than synthesized at save time - `**`/`~~`/
 * `_`/`*` live inside the run they mark, so the whole run can't simply be
 * skipped the way an `IGNORED_MARKS` entry in `document-text.ts` is: the
 * interior is genuine prose the speller and readability checks still need to
 * see, only the fence at each end is syntax. Reuses each mark's own
 * `DelimiterSpec` rather than a bare string so this can't drift from what
 * `ensure-delimiters-plugin.ts` itself considers a valid delimiter.
 */
const DELIMITED_MARKS: Record<string, DelimiterSpec> = {
	bold: fixedDelimiter('**'),
	strike: fixedDelimiter('~~'),
	italic: italicDelimiterSpec(),
	// A link's `](href "title")` is markup, and a URL is not prose: left in, the
	// speller flags every host and path segment and readability counts them as
	// words. The visible link text between the delimiters still gets checked.
	link: linkDelimiterSpec(),
}

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
 * own text actually matches one, the same check that plugin makes.
 */
export function delimiterRanges(doc: ProseMirrorNode): [number, number][] {
	const ranges: [number, number][] = []

	for (const [markName, spec] of Object.entries(DELIMITED_MARKS)) {
		const markType = doc.type.schema.marks[markName]
		if (!markType) continue

		for (const run of findMarkRuns(doc, markType)) {
			const runText = doc.textBetween(run.from, run.to)
			const openLength = spec.detectOpen(runText)
			const closeLength = spec.detectClose(runText)
			if (openLength + closeLength > runText.length) continue

			if (openLength > 0) ranges.push([run.from, run.from + openLength])
			if (closeLength > 0) ranges.push([run.to - closeLength, run.to])
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
