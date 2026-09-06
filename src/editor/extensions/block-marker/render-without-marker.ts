import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import type { BlockMarkerSpec } from '@/editor/extensions/block-marker/spec'
import { paragraphWithoutLeadingText } from '@/editor/extensions/paragraph-without-leading-text'

/**
 * Renders `node`'s content with its own marker text stripped from its first
 * paragraph. The wrapping list or blockquote still synthesizes the visible
 * marker exactly the way `prosemirror-markdown` always has, so leaving the
 * real one in the content too would double it up: `- - text`, `> > text`. See
 * `paragraph-without-leading-text.ts` for why the wrapping node stays the sole
 * writer rather than the content.
 */
export function renderWithoutMarker(
	state: MarkdownSerializerState,
	node: ProseMirrorNode,
	spec: BlockMarkerSpec
): void {
	const paragraph = node.firstChild
	if (!paragraph || paragraph.type.name !== 'paragraph') {
		state.renderContent(node)
		return
	}

	const stripped = paragraphWithoutLeadingText(
		paragraph,
		spec.length(paragraph.textContent)
	)

	state.render(stripped, node, 0)
	node.forEach((child, _offset, index) => {
		if (index === 0) return
		state.render(child, node, index)
	})
}
