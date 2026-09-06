import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import { renderWithoutMarker } from '@/editor/extensions/block-marker/render-without-marker'
import { blockquoteMarkerSpec } from '@/editor/extensions/block-marker/specs'

/**
 * A blockquote's own serialize: `prosemirror-markdown`'s stock
 * `wrapBlock('> ', ...)` behavior exactly - nested quotes still get every
 * ancestor level's `"> "` prefix synthesized this same way - except this
 * node's own first paragraph's leading `"> "` is now real content and would
 * otherwise double up.
 */
export function blockquoteMarkdownSerialize(
	state: MarkdownSerializerState,
	node: ProseMirrorNode
): void {
	state.wrapBlock('> ', null, node, () => {
		renderWithoutMarker(state, node, blockquoteMarkerSpec)
	})
}
