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

/** Code is not prose. Skipping the node also keeps mermaid sources unlinted. */
const IGNORED_NODES = new Set(['codeBlock'])

/** What an inline node that carries no text of its own stands in as. */
const INLINE_PLACEHOLDER: Record<string, string> = {
	// A line break ends a sentence as far as retext is concerned, which is what
	// a hard break means in prose.
	hardBreak: '\n',
}

export function getDocumentText(doc: ProseMirrorNode): DocumentText {
	const slices: TextSlice[] = []
	let text = ''

	doc.descendants((node, pos) => {
		if (IGNORED_NODES.has(node.type.name)) return false
		if (!node.isTextblock) return true

		if (text) text += BLOCK_SEPARATOR

		// Inline children are walked rather than using `textContent`, because a
		// paragraph split by marks holds several text nodes and only their own
		// positions place them correctly.
		node.forEach((child, childOffset) => {
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

/**
 * Converts an offset in the flattened text back to a document position.
 *
 * Offsets landing in a gap between slices - a block separator, or an inline
 * image - resolve to the end of the preceding slice, so a range never collapses
 * onto the wrong block.
 */
export function offsetToPosition(
	{ slices }: DocumentText,
	offset: number
): number | null {
	if (slices.length === 0) return null

	let low = 0
	let high = slices.length - 1
	let candidate = slices[0]

	while (low <= high) {
		const middle = (low + high) >> 1
		const slice = slices[middle]

		if (slice.offset <= offset) {
			candidate = slice
			low = middle + 1
		} else {
			high = middle - 1
		}
	}

	if (offset < candidate.offset) return null

	const within = Math.min(offset - candidate.offset, candidate.length)
	return candidate.from + within
}
