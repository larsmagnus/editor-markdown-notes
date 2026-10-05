import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import { readAdmonition } from '#src/editor/extensions/admonition/admonition-of'
import { renderWithoutMarker } from '#src/editor/extensions/block-marker/render-without-marker'
import { blockquoteMarkerSpec } from '#src/editor/extensions/block-marker/specs'

/**
 * A blockquote's own serialize: `prosemirror-markdown`'s stock
 * `wrapBlock('> ', ...)` behavior exactly - nested quotes still get every
 * ancestor level's `"> "` prefix synthesized this same way - except this
 * node's own first paragraph's leading `"> "` is now real content and would
 * otherwise double up. An admonition's `[!TYPE]` line is written tight against
 * the body, the way authors write it and the way GitHub documents it.
 */
export function blockquoteMarkdownSerialize(
	state: MarkdownSerializerState,
	node: ProseMirrorNode
): void {
	state.wrapBlock('> ', null, node, () => {
		renderWithoutMarker(state, node, blockquoteMarkerSpec, {
			tightAfterFirst: readAdmonition(node) !== null,
		})
	})
}
