/**
 * Finds a fenced construct's closing marker line within the text following
 * its opening line - shared by every fence parser (`code-fence.ts`,
 * `frontmatter-fence.ts`), which differ only in what the marker itself looks
 * like (backticks-plus-language vs. a bare `---`).
 *
 * The closing line, if present, is either the entire remainder (zero lines
 * of content) or a line of its own further down - one match covers both: an
 * optional line break, then the marker, then only trailing whitespace,
 * anchored to the very end of the text.
 *
 * Returns the character offset (within `rest`) the content ends at, or
 * `null` if no closing line is present yet.
 */
export function findClosingFence(rest: string, marker: string): number | null {
	const close = new RegExp(`(^|\\n)${marker}[ \\t]*$`).exec(rest)
	return close ? close.index : null
}
