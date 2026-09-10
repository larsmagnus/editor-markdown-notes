import type { CSSProperties } from 'react'

import type { RawLinkRange } from '#src/editor/extensions/link/find-raw-link-ranges'
import { styleObjectFor } from '#src/lib/shiki-token-style'
import type { RelativeToken } from '#src/lib/syntax-highlight-tokens'

/**
 * One run of raw-mode text: colored if it fell inside a Shiki token, and/or
 * marked with its link's index into `linkRanges` if it fell inside one -
 * both can apply to the same run, since a link's href is Shiki-colored too.
 */
export type HighlightSegment = {
	text: string
	style?: CSSProperties
	linkRangeIndex?: number
}

/**
 * Splits `text` into runs at every token boundary *and* every link parens
 * boundary, for rendering as the highlighted mirror behind the raw-mode
 * textarea - `RawMarkdownHighlight` colors a run from its token, and marks
 * it with `data-link-range` from `linkRangeIndex` so `use-raw-link-hover.ts`
 * can find a link's rendered rect to hover-test against.
 *
 * `tokens` are assumed sorted and non-overlapping, which is how Shiki's own
 * `codeToTokensBase` already returns them for a single block; link ranges
 * never overlap each other either (see `find-raw-link-ranges.ts`), though a
 * token and a link range commonly do - a href is colored *and* clickable.
 */
export function buildHighlightSegments(
	text: string,
	tokens: RelativeToken[],
	linkRanges: RawLinkRange[] = []
): HighlightSegment[] {
	const boundaries = new Set<number>([0, text.length])
	for (const token of tokens) {
		boundaries.add(token.offset)
		boundaries.add(token.offset + token.length)
	}
	for (const range of linkRanges) {
		boundaries.add(range.parensStart)
		boundaries.add(range.parensEnd)
	}

	const cuts = [...boundaries].sort((a, b) => a - b)
	const segments: HighlightSegment[] = []

	for (let i = 0; i < cuts.length - 1; i++) {
		const start = cuts[i]
		const end = cuts[i + 1]
		if (start === end) continue

		const token = tokens.find(
			(candidate) =>
				candidate.offset <= start && start < candidate.offset + candidate.length
		)
		const linkRangeIndex = linkRanges.findIndex(
			(range) => range.parensStart <= start && start < range.parensEnd
		)

		segments.push({
			text: text.slice(start, end),
			style: token ? styleObjectFor(token) : undefined,
			linkRangeIndex: linkRangeIndex === -1 ? undefined : linkRangeIndex,
		})
	}

	return segments
}
