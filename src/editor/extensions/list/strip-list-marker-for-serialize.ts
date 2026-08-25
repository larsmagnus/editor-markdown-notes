import { Fragment } from '@tiptap/pm/model'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * A copy of `paragraph` with its first `markerLength` characters removed -
 * serialize-time only, never touching the real document. `bulletList`/
 * `orderedList` are left to synthesize the visible marker exactly the way
 * `prosemirror-markdown`'s own `renderList` always has (`list-markdown-
 * spec.ts` never touches them), so a `listItem`/`taskItem`'s own serialize
 * needs to skip re-emitting the same characters as real content, or the
 * line doubles up: `- - text`.
 *
 * `renderList`'s `firstDelim` write and `wrapBlock`'s `this.delim` extension
 * happen in that fixed order regardless of what `firstDelim` returns - an
 * empty string (real marker text emitted as ordinary content instead)
 * leaves nothing to mark the output as "no longer blank" before the delim
 * extends, so the next line's continuation indent gets wrongly applied to
 * what should be the first line. Keeping `firstDelim` as the real
 * marker-writing callback it already was sidesteps that rather than
 * fighting it.
 */
export function paragraphWithoutMarker(
	paragraph: ProseMirrorNode,
	markerLength: number
): ProseMirrorNode {
	if (markerLength === 0) return paragraph

	const first = paragraph.firstChild
	if (!first || !first.isText || !first.text) return paragraph

	const remainingText = first.text.slice(markerLength)
	const rest = paragraph.content.cut(first.nodeSize)
	const content = remainingText
		? Fragment.from(
				paragraph.type.schema.text(remainingText, first.marks)
			).append(rest)
		: rest

	return paragraph.copy(content)
}
