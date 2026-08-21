import type { SearchMatch } from './search-match'

/**
 * An upper bound on the length of the searched-for text, derived from the
 * matches themselves.
 *
 * `getSearchResults` gives each match a line and a column but never the query,
 * and highlighting needs an end as well as a start. Every match begins with the
 * query, so the longest common prefix of each match's line from its column
 * onwards contains it.
 *
 * It is a bound, never a measurement: matches whose surrounding text also
 * agrees push it long. `Email addresses` and `the email field` share `email `
 * including the space, giving 6 for a 5-character query. More matches, and
 * matches from unrelated files, shrink it towards the truth; it can never come
 * out shorter than the query. Callers that need an exact extent must either
 * accept a highlight running slightly long or fall back to
 * `search.action.copyMatch`, which costs the user's clipboard.
 */
export function deriveQueryLength(matches: readonly SearchMatch[]): number {
	const slices = matches.map((match) => match.lineText.slice(match.column))
	const [first, ...rest] = slices
	if (!first) return 0

	// Case-insensitively, since a case-insensitive search matches text that
	// differs from the query only in case, and a case-sensitive one is
	// unaffected by comparing this way.
	let length = first.length
	for (const slice of rest) {
		length = Math.min(length, commonPrefixLength(first, slice))
		if (length === 0) return 0
	}

	return length
}

function commonPrefixLength(left: string, right: string): number {
	const limit = Math.min(left.length, right.length)

	let index = 0
	while (
		index < limit &&
		left[index]?.toLowerCase() === right[index]?.toLowerCase()
	) {
		index++
	}

	return index
}
