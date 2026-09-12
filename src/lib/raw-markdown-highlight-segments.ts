import type { CSSProperties } from 'react'

import type { RawLinkRange } from '#src/editor/extensions/link/find-raw-link-ranges'
import { styleObjectFor } from '#src/lib/shiki-token-style'
import type { RelativeToken } from '#src/lib/syntax-highlight-tokens'
import { issueClassName } from '#src/lib/text-tools/issue-class-name'
import type { SourcePlacedIssue } from '#src/lib/text-tools/place-source-issues'

/**
 * One run of raw-mode text: colored if it fell inside a Shiki token, marked
 * with its link's index into `linkRanges` if it fell inside one, and/or
 * carrying a text-tools issue's class and tooltip if it fell inside one - any
 * combination can apply to the same run, since a link's href is Shiki-colored
 * too, and a misspelling can sit inside emphasis.
 */
export type HighlightSegment = {
	text: string
	style?: CSSProperties
	linkRangeIndex?: number
	className?: string
	title?: string
}

/**
 * Splits `text` into runs at every token boundary, every link parens
 * boundary, and every text-tools issue boundary, for rendering as the
 * highlighted mirror behind the raw-mode textarea - `RawMarkdownHighlight`
 * colors a run from its token, marks it with `data-link-range` from
 * `linkRangeIndex` so `use-raw-link-hover.ts` can find a link's rendered rect
 * to hover-test against, and underlines it from its issue.
 *
 * `tokens` are assumed sorted and non-overlapping, which is how Shiki's own
 * `codeToTokensBase` already returns them for a single block; link ranges
 * never overlap each other either (see `find-raw-link-ranges.ts`), though a
 * token and a link range commonly do - a href is colored *and* clickable.
 * Issues, unlike tokens and link ranges, *can* overlap each other - a
 * readability tier spans a whole sentence, a misspelling inside it spans one
 * word - so each run picks the narrowest issue covering it rather than
 * whichever comes first, the same way a squiggle under one word should not be
 * hidden by a sentence-level highlight around it. A flat run of text can only
 * carry one issue's class at a time, unlike ProseMirror's own inline
 * decorations in the live editor, which can stack.
 */
export function buildHighlightSegments(
	text: string,
	tokens: RelativeToken[],
	linkRanges: RawLinkRange[] = [],
	issues: SourcePlacedIssue[] = []
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
	for (const issue of issues) {
		boundaries.add(issue.from)
		boundaries.add(issue.to)
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
		const issue = issues
			.filter((candidate) => candidate.from <= start && start < candidate.to)
			.reduce<SourcePlacedIssue | undefined>((narrowest, candidate) => {
				if (!narrowest) return candidate
				return candidate.to - candidate.from < narrowest.to - narrowest.from
					? candidate
					: narrowest
			}, undefined)

		segments.push({
			text: text.slice(start, end),
			style: token ? styleObjectFor(token) : undefined,
			linkRangeIndex: linkRangeIndex === -1 ? undefined : linkRangeIndex,
			className: issue ? issueClassName(issue.severity) : undefined,
			title: issue
				? issue.expected.length
					? `${issue.message} (try: ${issue.expected.join(', ')})`
					: issue.message
				: undefined,
		})
	}

	return segments
}
