import { parseLinkClose } from '#src/editor/extensions/link/link-close-text'

export type RawLinkRange = {
	href: string
	/** Character offset of the link's opening `[`. */
	linkStart: number
	/** Character offset where the link's parens content begins - right after
	 *  its `(`. */
	parensStart: number
	/** Character offset where the link's parens content ends - at its `)`,
	 *  exclusive. */
	parensEnd: number
}

/**
 * Every link in raw markdown source, with the bounds of its parens content
 * (href and optional title) - the only part of a link that is clickable or
 * gets the Cmd/Ctrl-hover underline in raw mode, per `raw-link-at-offset.ts`
 * and `use-raw-link-hover.ts`. The brackets and link text are not part of
 * either range.
 *
 * The closing `]` is found by balanced-bracket depth, not the first `]`
 * after `[`: link text may itself contain an image (`[![alt](img.png)](x.md)`),
 * whose own `[`/`]` would otherwise be mistaken for the outer link's close.
 * Scanning every `[` as a candidate start is what naturally reports that
 * nested image's own parens as its own separate range alongside the outer
 * link's.
 */
export function findRawLinkRanges(source: string): RawLinkRange[] {
	const ranges: RawLinkRange[] = []

	for (
		let start = source.indexOf('[');
		start !== -1;
		start = source.indexOf('[', start + 1)
	) {
		const closeBracket = findBalancedClose(source, start + 1, '[', ']')
		if (closeBracket === -1) continue
		if (source[closeBracket + 1] !== '(') continue

		const parensStart = closeBracket + 2
		const parensEnd = findBalancedClose(source, parensStart, '(', ')')
		if (parensEnd === -1) continue

		const parsed = parseLinkClose(source.slice(closeBracket, parensEnd + 1))
		if (!parsed) continue

		ranges.push({ href: parsed.href, linkStart: start, parensStart, parensEnd })
	}

	return ranges
}

/**
 * The unescaped `close` balancing the `open` already consumed just before
 * `from`, or -1 if there is none.
 */
function findBalancedClose(
	source: string,
	from: number,
	open: string,
	close: string
): number {
	let depth = 1
	for (let i = from; i < source.length; i++) {
		if (source[i] === '\\') {
			i++
			continue
		}
		if (source[i] === open) {
			depth++
		} else if (source[i] === close) {
			depth--
			if (depth === 0) return i
		}
	}

	return -1
}
