import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import type { BlockMarkerSpec } from '#src/editor/extensions/block-marker/spec'
import { paragraphWithoutLeadingText } from '#src/editor/extensions/paragraph-without-leading-text'

/**
 * Renders `node`'s content with its own marker text stripped from its first
 * paragraph. The wrapping list or blockquote still synthesizes the visible
 * marker exactly the way `prosemirror-markdown` always has, so leaving the
 * real one in the content too would double it up: `- - text`, `> > text`. See
 * `paragraph-without-leading-text.ts` for why the wrapping node stays the sole
 * writer rather than the content. `tightAfterFirst` ends that first paragraph
 * with a single newline instead of a blank line - written as plain text, which
 * is all an admonition's tag line ever holds.
 */
export function renderWithoutMarker(
	state: MarkdownSerializerState,
	node: ProseMirrorNode,
	spec: BlockMarkerSpec,
	{ tightAfterFirst = false }: { tightAfterFirst?: boolean } = {}
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

	if (tightAfterFirst) {
		state.write(stripped.textContent)
		state.ensureNewLine()
	} else {
		state.render(stripped, node, 0)
	}
	node.forEach((child, _offset, index) => {
		if (index === 0) return
		state.render(child, node, index)
	})
}
