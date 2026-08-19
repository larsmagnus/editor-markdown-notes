import type { Node as ProseMirrorNode } from 'prosemirror-model'

/**
 * Flattens a ProseMirror document into the plain text retext analyses, keeping
 * enough of a trail to turn the offsets it reports back into positions.
 */

/** A run of text and the document position its first character sits at. */
type TextSlice = {
	/** Offset of this run within the flattened text. */
	offset: number
	length: number
	/** Position of the run's first character in the ProseMirror document. */
	from: number
}

export type DocumentText = {
	text: string
	slices: TextSlice[]
}

/**
 * Blocks are joined by a blank line so retext sees separate sentences. Without
 * it two paragraphs run together and readability scores a sentence that does
 * not exist.
 */
const BLOCK_SEPARATOR = '\n\n'

/** Code is not prose, and skipping the node also keeps mermaid sources unlinted. */
const IGNORED_NODES = new Set(['codeBlock'])

/**
 * Marks whose text is not prose either.
 *
 * An inline `code` span holds identifiers, commands and paths - `useEffect`,
 * `pnpm run build` - which no writing check has an opinion worth hearing about,
 * and which the speller would flag almost without exception.
 */
const IGNORED_MARKS = new Set(['code'])

/** What an inline node that carries no text of its own stands in as. */
const INLINE_PLACEHOLDER: Record<string, string> = {
	// A line break ends a sentence as far as retext is concerned, which is what
	// a hard break means in prose.
	hardBreak: '\n',
}

/**
 * Splits a frontmatter block into one "block" per YAML line rather than
 * reading its whole `\n`-joined text as one run.
 *
 * A `title:`/`description:` field can hold real prose worth checking, but
 * retext has no concept of YAML's line-based `key: value` structure - fed the
 * whole multi-line block as a single run, it finds no sentence-ending
 * punctuation between lines and scores five unrelated lines as one giant
 * run-on sentence. Splitting on `\n` first gives each line its own sentence
 * boundary instead, so a prose value still gets checked and a bare `status:
 * draft` line - with nothing retext would flag - stays quiet.
 *
 * The key itself is dropped along with its separator. Keys are identifiers, not
 * prose - `og_image`, `slug`, `draft` - and the speller would flag most of them
 * on every note in the workspace.
 */
function appendFrontmatterLines(
	node: ProseMirrorNode,
	pos: number,
	text: string,
	slices: TextSlice[]
): string {
	let result = text
	let offset = 0

	for (const line of node.textContent.split('\n')) {
		const value = frontmatterValueOf(line)

		if (value.text) {
			// Reuses the same "already have text" check the block separator uses
			// everywhere else, so a line joins the block before it exactly the way
			// the block itself joins whatever textblock came before it.
			if (result) result += BLOCK_SEPARATOR
			// `pos` is the frontmatter node itself; its content starts one inside,
			// and `offset` walks `textContent`, which - `content: 'text*'`, no marks
			// - lines up with document positions one-for-one.
			slices.push({
				offset: result.length,
				length: value.text.length,
				from: pos + 1 + offset + value.start,
			})
			result += value.text
		}
		offset += line.length + 1
	}

	return result
}

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
 * A line with no `key:` prefix - a list item, or a wrapped continuation - is
 * prose all the way through. Leading whitespace is skipped by advancing `start`
 * rather than by trimming, because the caller turns it back into a document
 * position.
 */
function frontmatterValueOf(line: string) {
	const key = FRONTMATTER_KEY.exec(line)
	const afterKey = key ? key[0].length : 0
	const rest = line.slice(afterKey)
	const start = afterKey + rest.length - rest.trimStart().length

	return { text: line.slice(start).trimEnd(), start }
}

export function getDocumentText(doc: ProseMirrorNode): DocumentText {
	const slices: TextSlice[] = []
	let text = ''

	doc.descendants((node, pos) => {
		if (IGNORED_NODES.has(node.type.name)) return false
		if (!node.isTextblock) return true

		if (node.type.name === 'frontmatter') {
			text = appendFrontmatterLines(node, pos, text, slices)
			return false
		}

		if (text) text += BLOCK_SEPARATOR

		// Inline children are walked rather than using `textContent`, because a
		// paragraph split by marks holds several text nodes and only their own
		// positions place them correctly.
		node.forEach((child, childOffset) => {
			// Stood in for rather than dropped, for the same reason an image is:
			// `the `code` span` would otherwise reach retext as `the span`, and
			// text on either side of a bare `` `x` `` would weld into one word.
			if (child.marks.some((mark) => IGNORED_MARKS.has(mark.type.name))) {
				text += ' '
				return
			}

			if (!child.isText || !child.text) {
				// An unmapped separator, so the text on either side of an image or a
				// hard break is not welded into one word. `line<br>second` would
				// otherwise reach retext as `linesecond`, which it counts as a single
				// long word and scores the sentence's readability against.
				if (child.isInline) text += INLINE_PLACEHOLDER[child.type.name] ?? ' '
				return
			}

			slices.push({
				offset: text.length,
				length: child.text.length,
				// `pos` is the textblock itself; its content starts one inside.
				from: pos + 1 + childOffset,
			})
			text += child.text
		})

		return false
	})

	return { text, slices }
}
