import { hasLinkScheme } from '#src/editor/extensions/link/has-link-scheme'

const WHOLE_URL = /^\S*[^\s.,;:!?)\]}'"]$/

/**
 * Whether pasted text is nothing but a URL, so pasting it onto a selection
 * means linking that selection rather than replacing it. Trailing sentence
 * punctuation disqualifies it: `https://example.com).` is prose carrying a
 * URL, and linking it would put the punctuation in the href.
 */
export function looksLikeUrl(text: string): boolean {
	const trimmed = text.trim()
	if (!trimmed) return false
	return hasLinkScheme(trimmed) && WHOLE_URL.test(trimmed)
}
