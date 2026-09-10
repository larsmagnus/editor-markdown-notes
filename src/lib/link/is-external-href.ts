/**
 * A scheme per RFC 3986: a letter, then letters/digits/`+`/`.`/`-`, then `:`.
 * Excludes a single letter followed by `:` (`C:\notes.md`) - a real scheme is
 * never one character, so this also keeps a Windows drive path off the
 * external path.
 */
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]{1,}:/i

/**
 * Whether `href` is an absolute URL with a real scheme (`https:`, `mailto:`,
 * `vscode:`, …) rather than a relative workspace path or a same-document hash.
 * An external href keeps opening through `window.open`; anything else routes
 * through the host.
 */
export function isExternalHref(href: string): boolean {
	return SCHEME_PATTERN.test(href)
}
