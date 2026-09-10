import { findRawLinkRanges } from '#src/editor/extensions/link/find-raw-link-ranges'

export type RawLinkMatch = {
	href: string
	/** Character offset where the link's parens content begins. */
	start: number
	/** Character offset where the link's parens content ends, exclusive. */
	end: number
}

/**
 * The link whose parens content - its href and optional title - encloses
 * `offset`, or `null` outside one. The brackets and link text are
 * deliberately not part of this: only the parens content is clickable or
 * gets the Cmd/Ctrl-hover underline in raw mode (`use-raw-link-hover.ts`),
 * per `find-raw-link-ranges.ts`'s own doc comment.
 */
export function findLinkAtOffset(
	source: string,
	offset: number
): RawLinkMatch | null {
	const range = findRawLinkRanges(source).find(
		(candidate) =>
			offset >= candidate.parensStart && offset < candidate.parensEnd
	)

	if (!range) return null

	return { href: range.href, start: range.parensStart, end: range.parensEnd }
}
