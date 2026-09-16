import type { RevealToken } from '#src/editor/extensions/syntax-reveal/reveal-provider'

/**
 * The `url`/`title`/closing-`)` tail shared by a link's close delimiter and
 * an image's markdown text - both are CommonMark's own `(dest "title")`
 * shape, `titleRange` widened by one on each side to keep its surrounding
 * quotes with it. `text` is whichever string `urlRange`/`titleRange` were
 * matched against, since the trailing marker is always its very last char.
 */
export function urlTitleTokens(
	text: string,
	urlRange: [number, number],
	titleRange: [number, number] | undefined
): RevealToken[] {
	const tokens: RevealToken[] = []

	if (urlRange[1] > urlRange[0]) {
		tokens.push({ role: 'url', from: urlRange[0], to: urlRange[1] })
	}
	if (titleRange) {
		tokens.push({
			role: 'title',
			from: titleRange[0] - 1,
			to: titleRange[1] + 1,
		})
	}

	tokens.push({ role: 'marker', from: text.length - 1, to: text.length })
	return tokens
}
