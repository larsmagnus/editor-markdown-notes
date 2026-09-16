import type { RevealToken } from '#src/editor/extensions/syntax-reveal/reveal-provider'
import { urlTitleTokens } from '#src/editor/extensions/syntax-reveal/url-title-tokens'

/**
 * A link's closing delimiter, `](href)` or `](href "title")` - the literal
 * text `link-delimiter-spec.ts` detects/synthesizes and this module builds/
 * parses. `href` allows no bare whitespace (CommonMark's own rule for an
 * unangle-bracketed destination) and any literal parenthesis in it is
 * escaped, matching `prosemirror-markdown`'s own default link serializer so
 * a hand-typed URL containing one still round-trips.
 */
const CLOSE_PATTERN = /\]\((\S*)(?:\s+"((?:[^"\\]|\\.)*)")?\)$/d

export type ParsedLinkClose = { href: string; title: string | null }

/** How much of `text`'s tail is a valid closing delimiter, or 0 if none. */
export function detectLinkClose(text: string): number {
	return CLOSE_PATTERN.exec(text)?.[0].length ?? 0
}

/** Parses a closing delimiter (as found by `detectLinkClose`) into its href/title. */
export function parseLinkClose(closeText: string): ParsedLinkClose | null {
	const match = CLOSE_PATTERN.exec(closeText)
	if (!match || match[0].length !== closeText.length) return null

	return {
		href: match[1].replace(/\\([()])/g, '$1'),
		title: match[2] === undefined ? null : match[2].replace(/\\"/g, '"'),
	}
}

/** Builds a fresh closing delimiter for the given href/title. */
export function linkCloseText(
	href: string,
	title: string | null | undefined
): string {
	const escapedHref = href.replace(/[()]/g, '\\$&')
	const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : ''
	return `](${escapedHref}${titlePart})`
}

/**
 * `closeText`'s `](`/`)` as `marker` tokens, its href as a `url` token, and -
 * when present - its `"title"` (quotes included) as a `title` token. Reused
 * by `createDelimitedMarkRevealProvider` to style a link's parts separately;
 * see `delimiter-spec.ts`'s `closeTokens`.
 */
export function linkCloseTokens(closeText: string): RevealToken[] {
	const match = CLOSE_PATTERN.exec(closeText)
	if (!match?.indices) return []

	const [, hrefRange, titleRange] = match.indices
	if (!hrefRange) return []

	return [
		{ role: 'marker', from: 0, to: 2 },
		...urlTitleTokens(closeText, hrefRange, titleRange),
	]
}
