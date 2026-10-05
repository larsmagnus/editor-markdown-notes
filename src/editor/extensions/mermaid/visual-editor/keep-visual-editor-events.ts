import type { NodeViewRenderer } from '@tiptap/core'

import { VISUAL_EDITOR_ATTRIBUTE } from '#src/editor/extensions/mermaid/visual-editor/constants'

function isInsideVisualEditor(event: Event): boolean {
	return (
		event.target instanceof Element &&
		event.target.closest(`[${VISUAL_EDITOR_ATTRIBUTE}]`) !== null
	)
}

/**
 * Makes a node view keep every event that happens inside the visual editor, and
 * decide about all others as it always did.
 *
 * TipTap's own rule lets ProseMirror have a mouse press on anything that is not
 * a control, which is right for the rendered diagram and wrong for a canvas
 * that is handling the press itself. Supplying a `stopEvent` option instead
 * would replace that rule for the whole node view, so this adds to it.
 */
export function keepVisualEditorEvents(
	createNodeView: NodeViewRenderer
): NodeViewRenderer {
	return (props) => {
		const nodeView = createNodeView(props)
		const stockStopEvent = nodeView.stopEvent?.bind(nodeView)

		nodeView.stopEvent = (event) =>
			isInsideVisualEditor(event) || (stockStopEvent?.(event) ?? false)

		return nodeView
	}
}
