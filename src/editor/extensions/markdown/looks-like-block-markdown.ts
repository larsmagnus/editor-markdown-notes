/**
 * Whether a pasted string is worth reinterpreting as markdown.
 *
 * The clipboard's text flavour is also the only flavour for anything that ships
 * no `text/html` - terminal output, a plain editor, most CLI tools - so parsing
 * every text paste as markdown turned `a *= b * c` into emphasis and dropped
 * the asterisks. Block structure is the thing the plain-text fallback cannot
 * reproduce and the reason the parser is here at all, so that is the line.
 */

/** The line shapes that only markdown gives meaning to. */
const BLOCK_MARKDOWN_LINES: RegExp[] = [
	// Up to three spaces of indent is still a block start; four is code.
	/^ {0,3}#{1,6}(\s|$)/,
	/^ {0,3}[-*+]\s/,
	/^ {0,3}\d+[.)]\s/,
	/^ {0,3}>/,
	/^ {0,3}(```|~~~)/,
	/^ {0,3}([-*_])[ \t]*(\1[ \t]*){2,}$/,
]

/**
 * `| :--- | ---: |`, the line that makes the rows around it a table.
 *
 * The rows themselves are not enough: a single `| a | b |` is a paragraph in
 * GFM too, and pasting one as a table would be the same overreach as the
 * emphasis above.
 */
function isTableDelimiter(line: string): boolean {
	return line.includes('|') && line.includes('-') && /^[\s|:-]+$/.test(line)
}

/** Does any line of `text` open a markdown block? */
export function looksLikeBlockMarkdown(text: string): boolean {
	return text
		.split('\n')
		.some(
			(line) =>
				isTableDelimiter(line) ||
				BLOCK_MARKDOWN_LINES.some((pattern) => pattern.test(line))
		)
}
