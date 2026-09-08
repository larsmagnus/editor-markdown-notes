import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import { renderWithoutMarker } from '#src/editor/extensions/block-marker/render-without-marker'
import { listMarkerSpec } from '#src/editor/extensions/block-marker/specs'

/**
 * A `listItem`'s own serialize: the wrapping `bulletList`/`orderedList` still
 * synthesizes the visible marker exactly the way `prosemirror-markdown` always
 * has (`state.renderList`'s `firstDelim`), unchanged - so this only has to
 * make sure the item's own first paragraph doesn't render its marker text a
 * second time, now that it's real content there too.
 */
export function listItemMarkdownSerialize(
	state: MarkdownSerializerState,
	node: ProseMirrorNode
): void {
	renderWithoutMarker(state, node, listMarkerSpec)
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
	renderWithoutMarker(state, node, listMarkerSpec)
}
