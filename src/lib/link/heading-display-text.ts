/**
 * A heading's rendered text, stripped of its own literal markdown syntax -
 * the leading `#`x`level` marker, and inline delimiters (bold, italic, inline
 * code, strikethrough, link brackets). What a hash link's `#slug` matches
 * against, per `slugify-heading.ts`, since GitHub's own anchors are computed
 * from rendered text, not raw source.
 *
 * Delimiters are real characters both in the rich editor's node text (see
 * `heading-extension.ts`) and in raw markdown source, so one string-based
 * stripper serves `scroll-to-heading.ts` (given a heading node's
 * `textContent`) and `raw-heading-anchors.ts` (given a raw source line)
 * alike - approximate rather than a full markdown-it pass, which is enough
 * for matching a hash fragment.
 */
export function headingDisplayText(text: string): string {
	return text
		.replace(/^#{1,6}[ \t]+/, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/~~([^~]+)~~/g, '$1')
		.replace(/`+([^`]+)`+/g, '$1')
		.replace(
			/\*([^*]+)\*|_([^_]+)_/g,
			(_match, star, underscore) => star ?? underscore
		)
}
