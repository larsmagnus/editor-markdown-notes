import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

import { AppErrorBoundary } from '@/components/app-error-boundary'
import { CodeBlockCopyButton } from '@/editor/code-block-copy-button'
import { MermaidBlock } from '@/editor/mermaid/block'
import { MERMAID_LANGUAGE } from '@/editor/mermaid/language'

/**
 * The node view every code block renders through.
 *
 * A `mermaid` block shows its diagram and hides its source until it is clicked;
 * any other language keeps TipTap's `<pre><code>` output. The source itself is
 * untouched either way, so the markdown round trip is the same as it was before
 * this node view existed.
 *
 * Syntax highlighting needs nothing here: `SyntaxHighlight` colors the tokens
 * through decorations, and the block's own background and foreground come from
 * the custom properties `useSyntaxHighlight` hands `EditorSurface` to publish
 * on the editor container.
 */
export function CodeBlockView({ node, editor, getPos }: NodeViewProps) {
	const language = String(node.attrs.language ?? '')

	// TipTap mounts each node view as its own React root, so this is the only
	// place a boundary can contain one diagram without taking the document with
	// it - a boundary around the editor would catch the throw far too late.
	if (language === MERMAID_LANGUAGE) {
		return (
			<AppErrorBoundary title="This diagram" resetKeys={[node.textContent]}>
				<MermaidBlock node={node} editor={editor} getPos={getPos} />
			</AppErrorBoundary>
		)
	}

	return (
		<NodeViewWrapper as="pre" className="group relative">
			<CodeBlockCopyButton code={node.textContent} />
			<NodeViewContent<'code'>
				as="code"
				className={language ? `language-${language}` : undefined}
			/>
		</NodeViewWrapper>
	)
}
