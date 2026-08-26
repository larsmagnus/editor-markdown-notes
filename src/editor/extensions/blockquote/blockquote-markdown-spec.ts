import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import { blockquoteMarkerLength } from '@/editor/extensions/blockquote/blockquote-marker'
import { paragraphWithoutLeadingText } from '@/editor/extensions/paragraph-without-leading-text'

/**
 * A blockquote's own serialize: matches `prosemirror-markdown`'s stock
 * `wrapBlock('> ', ...)` behavior exactly - nested quotes still get every
 * ancestor level's `"> "` prefix synthesized this same way, unchanged (see
 * `blockquote-marker.ts`'s doc comment for why that still composes
 * correctly once only the innermost level's own paragraph carries a real
 * marker) - except this node's own first paragraph's leading `"> "` is now
 * real content and would otherwise double up: `paragraphWithoutLeadingText`
 * strips it first, the same fix `list-markdown-spec.ts` needed for list
 * markers.
 */
export function blockquoteMarkdownSerialize(
	state: MarkdownSerializerState,
	node: ProseMirrorNode
): void {
	state.wrapBlock('> ', null, node, () => {
		const first = node.firstChild
		if (!first || first.type.name !== 'paragraph') {
			state.renderContent(node)
			return
		}

		const markerLength = blockquoteMarkerLength(first.textContent)
		const stripped = paragraphWithoutLeadingText(first, markerLength)

		state.render(stripped, node, 0)
		node.forEach((child, _offset, index) => {
			if (index === 0) return
			state.render(child, node, index)
		})
	})
}
