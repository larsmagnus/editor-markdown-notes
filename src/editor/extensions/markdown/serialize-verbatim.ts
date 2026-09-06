import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

/**
 * Writes a block's text back out exactly as it stands, escaping nothing - what
 * every construct whose syntax is already real content in it needs, a code
 * block's fences and a horizontal rule's `---` alike. Synthesizing the syntax
 * here, which is what the stock serializers do, would double it up on top of
 * the text that already carries it.
 */
export function serializeVerbatim(
	state: MarkdownSerializerState,
	node: ProseMirrorNode
): void {
	state.text(node.textContent, false)
	state.ensureNewLine()
	state.closeBlock(node)
}
