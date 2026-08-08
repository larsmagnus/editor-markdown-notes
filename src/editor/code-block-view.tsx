import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

import { MermaidBlock } from '@/editor/mermaid-block'
import { MERMAID_LANGUAGE } from '@/editor/mermaid-language'

/**
 * The node view every code block renders through.
 *
 * A `mermaid` block shows its diagram and hides its source until it is clicked;
 * any other language keeps TipTap's `<pre><code>` output. The source itself is
 * untouched either way, so the markdown round trip is the same as it was before
 * this node view existed.
 */
export function CodeBlockView({ node, editor, getPos }: NodeViewProps) {
	const language = String(node.attrs.language ?? '')

	if (language === MERMAID_LANGUAGE) {
		return <MermaidBlock node={node} editor={editor} getPos={getPos} />
	}

	return (
		<NodeViewWrapper as="pre">
			<NodeViewContent
				as="code"
				className={language ? `language-${language}` : undefined}
			/>
		</NodeViewWrapper>
	)
}
