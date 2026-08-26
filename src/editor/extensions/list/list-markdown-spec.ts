import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import { parseListMarker } from '@/editor/extensions/list/list-marker'
import { paragraphWithoutLeadingText } from '@/editor/extensions/paragraph-without-leading-text'

/**
 * Renders `node`'s content with its own marker stripped from its first
 * paragraph - shared by `listItemMarkdownSerialize` and
 * `taskItemMarkdownSerialize`, which differ only in what (if anything) they
 * write back in the marker's place. See `paragraph-without-leading-text.ts`
 * for why the marker is stripped here rather than left for the wrapping
 * list to double up on.
 */
function renderItemWithoutMarker(
	state: MarkdownSerializerState,
	node: ProseMirrorNode
): void {
	const paragraph = node.firstChild
	if (!paragraph || paragraph.type.name !== 'paragraph') {
		state.renderContent(node)
		return
	}

	const markerLength = parseListMarker(paragraph.textContent)?.markerLength ?? 0
	const stripped = paragraphWithoutLeadingText(paragraph, markerLength)

	state.render(stripped, node, 0)
	node.forEach((child, _offset, index) => {
		if (index === 0) return
		state.render(child, node, index)
	})
}

/**
 * A `listItem`'s own serialize: the wrapping `bulletList`/`orderedList`
 * still synthesizes the visible marker exactly the way
 * `prosemirror-markdown` always has (`state.renderList`'s `firstDelim`),
 * unchanged - so this only has to make sure the item's own first paragraph
 * doesn't render its marker text a second time, now that it's real content
 * there too.
 */
export function listItemMarkdownSerialize(
	state: MarkdownSerializerState,
	node: ProseMirrorNode
): void {
	renderItemWithoutMarker(state, node)
}

/**
 * A `taskItem`'s own serialize. Unlike a plain `listItem`, the wrapping
 * `taskList` only ever synthesizes the bullet portion (`- `) - `checked`
 * itself was always this node's own responsibility to write
 * (`tiptap-markdown`'s bundled `taskItem` does the same, from the same
 * attribute), so this still has to, even though the bullet+space no longer
 * does.
 */
export function taskItemMarkdownSerialize(
	state: MarkdownSerializerState,
	node: ProseMirrorNode
): void {
	state.write(node.attrs.checked ? '[x] ' : '[ ] ')
	renderItemWithoutMarker(state, node)
}
