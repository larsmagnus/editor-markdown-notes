import type { Editor, NodeViewProps } from '@tiptap/react'

/**
 * Moves the caret to the very start of a node view's own content - what
 * mermaid's "Edit source" and frontmatter's "Edit source" both use to enter
 * a block, since revealing a block's syntax is driven entirely by where the
 * caret is (`useCaretInside`, `SyntaxReveal`), not by a separate flag.
 *
 * `getPos` survives the node view being detached and returns `undefined`
 * from then on, which would make the target position `NaN` - see
 * `useCaretInside`'s own doc comment for why that race is real.
 */
export function focusBlockContentStart(
	editor: Editor,
	getPos: NodeViewProps['getPos']
): void {
	const pos = typeof getPos === 'function' ? getPos() : undefined
	if (pos === undefined) return

	editor
		.chain()
		.focus()
		.setTextSelection(pos + 1)
		.run()
}
