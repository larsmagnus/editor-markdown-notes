import type { Editor, NodeViewProps } from '@tiptap/react'

import { parseFence } from '#src/editor/extensions/code-block/code-fence'

type WriteDiagramCodeOptions = {
	editor: Editor
	getPos: NodeViewProps['getPos']
	code: string
}

/**
 * Replaces a mermaid block's code between its fences, leaving the fences
 * themselves alone, so a canvas edit lands in the document as the same text
 * edit typing the source would have made - undo history and sync included.
 */
export function writeDiagramCode({
	editor,
	getPos,
	code,
}: WriteDiagramCodeOptions): void {
	const pos = typeof getPos === 'function' ? getPos() : undefined
	if (pos === undefined) return

	const node = editor.state.doc.nodeAt(pos)
	if (!node) return

	const { codeFrom, codeTo } = parseFence(node.textContent)
	const contentStart = pos + 1

	editor.view.dispatch(
		editor.state.tr.insertText(
			code,
			contentStart + codeFrom,
			contentStart + codeTo
		)
	)
}
