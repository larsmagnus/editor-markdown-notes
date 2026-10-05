import type { MermaidWysiwygEditor } from '@visimer/core'
import type { MermaidCanvasView } from '@visimer/dom'

import { NODE_ENTITY_PREFIX } from '#src/editor/extensions/mermaid/visual-editor/constants'

function bareId(entityId: string): string {
	return entityId.slice(NODE_ENTITY_PREFIX.length)
}

/**
 * Adds a node after `sourceId` and opens its label for typing, in one gesture -
 * visimer itself can only connect two nodes that already exist.
 *
 * The label can only be edited once a render has drawn the new node, hence
 * waiting for the next one.
 */
export function addConnectedNode(
	wysiwyg: MermaidWysiwygEditor,
	canvas: MermaidCanvasView,
	sourceId: string
): void {
	const created = wysiwyg.dispatch({
		type: 'addNode',
		shape: 'rect',
		label: 'New node',
	})?.created?.[0]
	if (!created) return

	wysiwyg.dispatch({
		type: 'connect',
		source: bareId(sourceId),
		target: bareId(created),
	})
	wysiwyg.setSelection([created], 'canvas')

	const stopWaiting = canvas.on('render', () => {
		stopWaiting()
		requestAnimationFrame(() => canvas.editEntityLabel(created))
	})
}
