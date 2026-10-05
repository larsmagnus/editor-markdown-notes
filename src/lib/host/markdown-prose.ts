const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/

/**
 * The body's lines with fenced code blanked out rather than removed, so a line
 * keeps its neighbours - a setext underline is only one when it follows text.
 */
export function proseLines(body: string): string[] {
	let fence: string | null = null

	return body.split(/\r?\n/).map((line) => {
		const marker = FENCE_OPEN.exec(line)?.[1]

		if (fence === null) {
			if (marker) fence = marker
			return fence === null ? line : ''
		}

		if (isFenceClose(line, fence)) fence = null
		return ''
	})
}

/** A closing fence repeats the opening one's character at least as many times. */
function isFenceClose(line: string, fence: string): boolean {
	const closing = new RegExp(`^ {0,3}${fence[0]}{${fence.length},}[ \\t]*$`)
	return closing.test(line)
}

/**
 * Reduces inline markdown to the text a reader sees: link and image text kept,
 * their targets, emphasis, code ticks and HTML tags dropped. Underscores inside
 * a word (`snake_case`) are text, not emphasis.
 */
export function stripInlineMarkup(text: string): string {
	return text
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/!?\[([^\]]*)\]\[[^\]]*\]/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/\*+|~~|`+|(?<!\w)_+|_+(?!\w)/g, '')
		.replace(/\|/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

/** Cuts at the last word boundary before the limit, when there is one. */
export function truncateAtWord(text: string, limit: number): string {
	if (text.length <= limit) return text

	const cut = text.slice(0, limit)
	const lastSpace = cut.lastIndexOf(' ')
	const kept = lastSpace > 0 ? cut.slice(0, lastSpace) : cut

	return `${kept.trimEnd()}…`
}
