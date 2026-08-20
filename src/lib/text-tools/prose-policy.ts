/**
 * What counts as prose, shared by the two things that flatten a note for
 * retext: `document-text.ts` walking the editor's ProseMirror document, and
 * `src/mcp/markdown-text.ts` walking mdast for the MCP server.
 *
 * Neither tree can be derived from the other - the editor's schema needs React
 * node views, which cannot be loaded in the MCP server's process - so the two
 * walks stay separate and this module holds the decisions they must agree on.
 * `prose-parity.test.ts` is what actually proves they still do; the types here
 * only make a divergence fail early rather than silently.
 *
 * Pure strings, no ProseMirror import: this file is bundled into the MCP
 * server, which must not pull the editor's schema in behind it.
 */

/**
 * The constructs excluded from prose, named by concept rather than by either
 * tree's node names.
 *
 * Each extractor keys a `Record<ProseExclusion, …>` off this union to list its
 * own names for each, so adding a concept here fails to compile on both sides
 * until both handle it.
 */
export type ProseExclusion =
	| 'codeBlock'
	| 'inlineCode'
	| 'hardBreak'
	| 'atomInline'

/**
 * What each excluded construct leaves behind in its place.
 *
 * Stood in for rather than dropped, because dropping welds the text on either
 * side into one word: ``the `code` span`` would reach retext as `the span`, and
 * `line<br>second` as `linesecond` - which it counts as one long word and
 * scores the sentence's readability against.
 *
 * A code block is the exception at `''`, because it is a block: whatever
 * follows it is already separated by `BLOCK_SEPARATOR`.
 */
export const PROSE_SUBSTITUTE: Record<ProseExclusion, string> = {
	codeBlock: '',
	inlineCode: ' ',
	// A line break ends a sentence as far as retext is concerned, which is what
	// a hard break means in prose.
	hardBreak: '\n',
	atomInline: ' ',
}

/**
 * Blocks are joined by a blank line so retext sees separate sentences. Without
 * it two paragraphs run together and readability scores a sentence that does
 * not exist.
 */
export const BLOCK_SEPARATOR = '\n\n'

/**
 * A YAML key, up to and including its colon.
 *
 * Requires whitespace or end-of-line after the colon, so a `url: https://…`
 * value is not mistaken for a second key.
 */
const FRONTMATTER_KEY = /^\s*[\w.$-]+:(?=\s|$)/

/**
 * The prose half of one frontmatter line, and where in the line it starts.
 *
 * A `title:`/`description:` field can hold real prose worth checking, but the
 * key itself is an identifier, not prose - `og_image`, `slug`, `draft` - and
 * the speller would flag most of them on every note in the workspace, so it is
 * dropped along with its separator.
 *
 * A line with no `key:` prefix - a list item, or a wrapped continuation - is
 * prose all the way through. Leading whitespace is skipped by advancing `start`
 * rather than by trimming, because callers turn it back into a position.
 */
export function frontmatterValueOf(line: string) {
	const key = FRONTMATTER_KEY.exec(line)
	const afterKey = key ? key[0].length : 0
	const rest = line.slice(afterKey)
	const start = afterKey + rest.length - rest.trimStart().length

	return { text: line.slice(start).trimEnd(), start }
}
