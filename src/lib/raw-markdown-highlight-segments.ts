import type { CSSProperties } from 'react'

import { styleObjectFor } from '#src/lib/shiki-token-style'
import type { RelativeToken } from '#src/lib/syntax-highlight-tokens'

/** One run of raw-mode text, colored if it fell inside a Shiki token. */
export type HighlightSegment = { text: string; style?: CSSProperties }

/**
 * Splits `text` into plain and colored runs at each token's boundaries, for
 * rendering as the highlighted mirror behind the raw-mode textarea.
 *
 * `tokens` are assumed sorted and non-overlapping, which is how Shiki's own
 * `codeToTokensBase` already returns them for a single block.
 */
export function buildHighlightSegments(
	text: string,
	tokens: RelativeToken[]
): HighlightSegment[] {
	const segments: HighlightSegment[] = []
	let cursor = 0

	for (const token of tokens) {
		if (token.offset > cursor) {
			segments.push({ text: text.slice(cursor, token.offset) })
		}

		const end = token.offset + token.length
		segments.push({
			text: text.slice(token.offset, end),
			style: styleObjectFor(token),
		})
		cursor = end
	}

	if (cursor < text.length) {
		segments.push({ text: text.slice(cursor) })
	}

	return segments
}
