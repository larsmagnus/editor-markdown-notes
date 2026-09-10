/**
 * GitHub's heading-anchor algorithm: lowercase, drop anything that isn't a
 * Unicode letter/digit/space/hyphen, then collapse whitespace runs to a
 * single hyphen. Operates on already-rendered heading text (see
 * `heading-display-text.ts`/`raw-heading-anchors.ts`), never on raw markdown
 * source, since a link's `#hash` matches what a reader sees, not `**`/`` ` ``.
 */
export function slugifyHeading(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\p{L}\p{N} -]/gu, '')
		.trim()
		.replace(/\s+/g, '-')
}
