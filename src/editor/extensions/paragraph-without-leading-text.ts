import { Fragment } from '@tiptap/pm/model'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * A copy of `paragraph` with its first `length` characters removed -
 * serialize-time only, never touching the real document. Keeps a construct
 * whose wrapping node still synthesizes its own leading syntax from doubling
 * it up on the real marker text inside: `- - text`, `> > text`.
 *
 * The wrapping node has to stay the sole writer rather than the content:
 * `renderList`'s `firstDelim` write and `wrapBlock`'s delimiter extension
 * happen in a fixed order, and only a non-empty first write marks the output
 * as no longer blank - so an empty one leaves the next line's continuation
 * indent wrongly applied to what should be the first line.
 */
export function paragraphWithoutLeadingText(
	paragraph: ProseMirrorNode,
	length: number
): ProseMirrorNode {
	if (length === 0) return paragraph

	const first = paragraph.firstChild
	if (!first || !first.isText || !first.text) return paragraph

	const remainingText = first.text.slice(length)
	const rest = paragraph.content.cut(first.nodeSize)
	const content = remainingText
		? Fragment.from(
				paragraph.type.schema.text(remainingText, first.marks)
			).append(rest)
		: rest

	return paragraph.copy(content)
}
