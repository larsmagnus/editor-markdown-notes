const LINK_SCHEME = /^(?:(?:https?|ftp):\/\/|mailto:)/i

/**
 * Whether a detected link spells out its scheme - the same line
 * `StrictLinkify` draws for markdown-it, so a paste and a reload agree on what
 * counts as a link.
 */
export function hasLinkScheme(url: string): boolean {
	return LINK_SCHEME.test(url)
}
