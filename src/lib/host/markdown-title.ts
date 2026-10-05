import {
	proseLines,
	stripInlineMarkup,
	truncateAtWord,
} from '#src/lib/host/markdown-prose'

const TITLE_MAX_LENGTH = 80

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
		if (text) return truncateAtWord(text, TITLE_MAX_LENGTH)
	}

	return null
}

/** Drops nested markers too, so `> - item` reads as `item`. */
function stripBlockMarkers(line: string): string {
	const stripped = line.replace(BLOCK_MARKER, '')
	return stripped === line ? line : stripBlockMarkers(stripped)
}
