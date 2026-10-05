import type { NodeViewProps } from '@tiptap/react'
import type { MermaidWysiwygEditor } from '@visimer/core'
import type { MermaidCanvasView } from '@visimer/dom'

import { drawCanvas } from '#src/editor/extensions/mermaid/visual-editor/draw-canvas'
import type { DrawnCanvas } from '#src/editor/extensions/mermaid/visual-editor/draw-canvas'
import { shieldChromePointerdown } from '#src/editor/extensions/mermaid/visual-editor/shield-chrome-pointerdown'
import { writeDiagramCode } from '#src/editor/extensions/mermaid/visual-editor/write-diagram-code'

export type MountVisimerOptions = Pick<NodeViewProps, 'editor' | 'getPos'> & {
	code: string
	dark: boolean
	/** The frame holding the canvas and the chrome drawn over it. */
	frame: HTMLElement
	/** Where visimer draws. */
	canvas: HTMLElement
	onSelectionChange: (entityIds: string[]) => void
	onConnectingChange: (connecting: boolean) => void
}

export type MountedVisimer = {
	view: MermaidCanvasView
	wysiwyg: MermaidWysiwygEditor
	destroy: () => void
}

/**
 * Draws visimer's canvas over a mermaid block and wires it to the document:
 * every change it makes is written into the block's fence.
 *
 * Mermaid and visimer arrive over a dynamic import, as the diagram itself
 * does, so a note nobody edits visually never loads them.
 */
export async function mountVisimer({
	editor,
	getPos,
	code,
	dark,
	frame,
	canvas,
	onSelectionChange,
	onConnectingChange,
}: MountVisimerOptions): Promise<MountedVisimer> {
	const [{ default: mermaid }, core, dom] = await Promise.all([
		import('mermaid'),
		import('@visimer/core'),
		import('@visimer/dom'),
	])

	const unshield = shieldChromePointerdown(frame, canvas)
	let drawn: DrawnCanvas
	try {
		drawn = drawCanvas({ core, dom, mermaid, code, dark, canvas })
	} catch (error) {
		// The shield outlives a canvas that never started, and would swallow
		// every press on the editor's own buttons from then on.
		unshield()
		throw error
	}
	const { wysiwyg, view } = drawn

	const offChange = wysiwyg.on('change', ({ code: next }) => {
		writeDiagramCode({ editor, getPos, code: next })
		// Deleting a node does not announce that its selection went with it.
		onSelectionChange(
			wysiwyg.selection.filter((id) => wysiwyg.entityExists(id))
		)
	})
	const offSelection = wysiwyg.on('selectionChange', ({ entityIds }) =>
		onSelectionChange(entityIds)
	)
	const offTool = view.on('toolChange', (tool) =>
		onConnectingChange(tool === 'connect')
	)

	return {
		view,
		wysiwyg,
		destroy() {
			offChange()
			offSelection()
			offTool()
			view.destroy()
			unshield()
		},
	}
}
