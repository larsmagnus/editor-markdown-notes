// The trailing `(?:\r?\n){0,2}` is optional so a frontmatter-only note (no
// body, no newline after the closing fence) still matches - otherwise the
// leading `---` falls through to markdown-it and gets parsed as an `<hr>`.
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n){0,2}/

export function splitFrontmatter(markdown: string): {
	frontmatter: string | null
	body: string
} {
	const match = FRONTMATTER_PATTERN.exec(markdown)
	if (!match) return { frontmatter: null, body: markdown }

	return {
		frontmatter: match[1] ?? '',
		body: markdown.slice(match[0].length),
	}
}

// `null` means "no frontmatter block" and is omitted entirely. Any string -
// including '' - means the block exists and its fences are preserved, so an
// intentionally empty block doesn't disappear on the next save.
export function joinFrontmatter(
	frontmatter: string | null,
	body: string
): string {
	if (frontmatter === null) return body

	const trimmed = frontmatter.trim()
	return trimmed ? `---\n${trimmed}\n---\n\n${body}` : `---\n---\n\n${body}`
}
