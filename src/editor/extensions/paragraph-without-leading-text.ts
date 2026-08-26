import { Fragment } from '@tiptap/pm/model'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * A copy of `paragraph` with its first `length` characters removed -
 * serialize-time only, never touching the real document. Shared by every
 * construct whose wrapping node still synthesizes its own leading markdown
 * syntax exactly the way `prosemirror-markdown` always has
 * (`list-markdown-spec.ts`'s `bulletList`/`orderedList`, `blockquote-
 * markdown-spec.ts`'s `> `) while its first child's own real, editable
 * marker text would otherwise double up on top of it: `- - text`,
 * `> > text`.
 *
 * `renderList`'s `firstDelim` write and `wrapBlock`'s `this.delim` extension
 * happen in a fixed order regardless of what `firstDelim`/the wrapped
 * callback returns - an empty first line (real marker text emitted as
 * ordinary content instead) leaves nothing to mark the output as "no longer
 * blank" before the delimiter extends, so the next line's continuation
 * indent/prefix gets wrongly applied to what should be the first line.
 * Stripping the marker here, and leaving the wrapping node's own synthesis
 * as the sole writer of it, sidesteps that rather than fighting it.
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
