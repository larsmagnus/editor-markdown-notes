import {
	proseLines,
	stripInlineMarkup,
	truncateAtWord,
} from '#src/lib/host/markdown-prose'

const CONTENT_MAX_LENGTH = 200

const NON_PARAGRAPH_START =
	/^(?: {4}|\t)|^ {0,3}(?:#{1,6}(?:[ \t]|$)|>|[-*+][ \t]|\d+[.)][ \t]|\||<|\[[^\]]+\]:)/
const THEMATIC_BREAK = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/
const SETEXT_UNDERLINE = /^ {0,3}(?:=+|-+)[ \t]*$/
const IMAGE = /!\[[^\]]*\]\([^)]*\)/g

/**
 * The first run of plain prose, as a card's worth of text. Headings, lists,
 * quotes, tables, code and HTML are structure rather than something to read, so
 * they are passed over, and an image's alt text is not prose. A paragraph that only restates `title` is passed over
 * too, since a title taken from the opening line would otherwise appear twice.
 * `null` when the note has no prose.
 */
export function firstParagraph(body: string, title: string): string | null {
	const titleText = title.replace(/…$/, '')

	for (const block of splitBlocks(proseLines(body))) {
		if (!isParagraph(block)) continue

		const text = stripInlineMarkup(block.join(' ').replace(IMAGE, ''))
		if (!text || (titleText && text.startsWith(titleText))) continue

		return truncateAtWord(text, CONTENT_MAX_LENGTH)
	}

	return null
}

/** Runs of consecutive non-blank lines. */
function splitBlocks(lines: string[]): string[][] {
	const blocks: string[][] = []
	let current: string[] = []

	for (const line of lines) {
		if (line.trim()) {
			current.push(line)
			continue
		}
		if (current.length > 0) blocks.push(current)
		current = []
	}
	if (current.length > 0) blocks.push(current)

	return blocks
}

/** Not a heading (ATX or setext), list, quote, table, code, HTML or definition. */
function isParagraph(block: string[]): boolean {
	const [first = '', second = ''] = block

	return (
		!NON_PARAGRAPH_START.test(first) &&
		!THEMATIC_BREAK.test(first) &&
		!SETEXT_UNDERLINE.test(second)
	)
}
