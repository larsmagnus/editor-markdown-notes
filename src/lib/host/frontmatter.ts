// The trailing `(?:\r?\n){0,2}` is optional so a frontmatter-only note (no
// body, no newline after the closing fence) still matches - otherwise the
// leading `---` falls through to markdown-it and gets parsed as an `<hr>`.
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n){0,2}/

export function splitFrontmatter(markdown: string): {
	frontmatter: string | null
	body: string
	/**
	 * Source lines the frontmatter occupies; subtract from a source line number
	 * to get the same position in `body`.
	 *
	 * Returned rather than recomputed by callers because the pattern above eats
	 * nought to two trailing newlines, so the shift varies with the file.
	 */
	lineOffset: number
} {
	const match = FRONTMATTER_PATTERN.exec(markdown)
	if (!match) return { frontmatter: null, body: markdown, lineOffset: 0 }

	return {
		frontmatter: match[1] ?? '',
		body: markdown.slice(match[0].length),
		lineOffset: countNewlines(match[0]),
	}
}

function countNewlines(text: string): number {
	return text.split('\n').length - 1
}
