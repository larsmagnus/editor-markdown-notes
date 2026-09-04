import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'

import { CodeBlockSource } from '@/editor/extensions/code-block/code-block-source'
import {
	fenceCode,
	fenceLanguage,
} from '@/editor/extensions/code-block/code-fence'
import { focusBlockContentStart } from '@/editor/extensions/focus-block-content-start'
import { MermaidDiagram } from '@/editor/extensions/mermaid/diagram'
import { MERMAID_LANGUAGE } from '@/editor/extensions/mermaid/language'
import { useMermaidSource } from '@/hooks/use-mermaid-source'

/**
 * The node view every code block renders through: its source, and for a
 * `mermaid` block the diagram drawn in front of it.
 *
 * Both are always mounted, and in that order, because the fence tag is editable
 * text - a block stops and starts being a diagram *as it is typed into*.
 * Choosing between two different trees instead would tear the content DOM out
 * from under the caret on the keystroke that ends the word `mermaid`.
 *
 * Syntax highlighting needs nothing here: `SyntaxHighlight` colors the tokens
 * through decorations, and the block's own background and foreground come from
 * the custom properties `useSyntaxHighlight` hands `EditorSurface` to publish
 * on the editor container.
 */
export function CodeBlockView({ node, editor, getPos }: NodeViewProps) {
	const language = fenceLanguage(node.textContent)
	const code = fenceCode(node.textContent)
	const { result, showSource } = useMermaidSource({
		editor,
		getPos,
		code,
		isMermaid: language === MERMAID_LANGUAGE,
	})

	// Moving the caret into the block is what reveals the source - there is no
	// separate editing flag to set.
	const startEditing = () => focusBlockContentStart(editor, getPos)

	return (
		<NodeViewWrapper className="group relative">
			<MermaidDiagram
				code={code}
				result={result}
				showSource={showSource}
				onEdit={startEditing}
			/>
			<CodeBlockSource code={code} language={language} visible={showSource} />
		</NodeViewWrapper>
	)
}
