const TITLE_MAX_LENGTH = 80

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/
const ATX_H1 = /^ {0,3}#[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/
const SETEXT_H1_UNDERLINE = /^ {0,3}=+[ \t]*$/
const THEMATIC_BREAK = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/
const BLOCK_MARKER =
	/^[ \t]*(?:#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+(?:\[[ xX]\][ \t]+)?|\d+[.)][ \t]+)/

/**
 * The text of the first level-one heading, ATX or setext, outside fenced code.
 * `null` when there is none.
 */
export function findH1(body: string): string | null {
	const lines = proseLines(body)

	for (const [index, line] of lines.entries()) {
		const atx = ATX_H1.exec(line)?.[1]
		const setext =
			line.trim() && SETEXT_H1_UNDERLINE.test(lines[index + 1] ?? '')
				? line
				: undefined
		const heading = stripInlineMarkup(atx ?? setext ?? '')

		if (heading) return heading
	}

	return null
}

/**
 * The first line of readable text, stripped of markdown and cut to a card's
 * worth at a word boundary. `null` for a note with no text at all.
 */
export function firstTextLine(body: string): string | null {
	for (const line of proseLines(body)) {
		if (THEMATIC_BREAK.test(line)) continue

		const text = stripInlineMarkup(stripBlockMarkers(line))
		if (text) return truncate(text)
	}

	return null
}

/**
 * The body's lines with fenced code blanked out rather than removed, so a line
 * keeps its neighbours - a setext underline is only one when it follows text.
 */
function proseLines(body: string): string[] {
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

/** Drops nested markers too, so `> - item` reads as `item`. */
function stripBlockMarkers(line: string): string {
	const stripped = line.replace(BLOCK_MARKER, '')
	return stripped === line ? line : stripBlockMarkers(stripped)
}

/**
 * Reduces inline markdown to the text a reader sees: link and image text kept,
 * their targets, emphasis, code ticks and HTML tags dropped. Underscores inside
 * a word (`snake_case`) are text, not emphasis.
 */
function stripInlineMarkup(text: string): string {
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
function truncate(text: string): string {
	if (text.length <= TITLE_MAX_LENGTH) return text

	const cut = text.slice(0, TITLE_MAX_LENGTH)
	const lastSpace = cut.lastIndexOf(' ')
	const kept = lastSpace > 0 ? cut.slice(0, lastSpace) : cut

	return `${kept.trimEnd()}…`
}
