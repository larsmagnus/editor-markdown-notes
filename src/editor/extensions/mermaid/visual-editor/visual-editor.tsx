import type { NodeViewProps } from '@tiptap/react'
import { useRef } from 'react'

import { addConnectedNode } from '#src/editor/extensions/mermaid/visual-editor/add-connected-node'
import { AddNodeHandle } from '#src/editor/extensions/mermaid/visual-editor/add-node-handle'
import {
	NODE_ENTITY_PREFIX,
	VISUAL_EDITOR_ATTRIBUTE,
} from '#src/editor/extensions/mermaid/visual-editor/constants'
import { keepSelectAllInLabel } from '#src/editor/extensions/mermaid/visual-editor/keep-select-all-in-label'
import { VisualEditorToolbar } from '#src/editor/extensions/mermaid/visual-editor/toolbar'
import { useSelectedNodeAnchor } from '#src/hooks/use-selected-node-anchor'
import { useVisimerCanvas } from '#src/hooks/use-visimer-canvas'

type MermaidVisualEditorProps = Pick<NodeViewProps, 'editor' | 'getPos'> & {
	code: string
	onDone: () => void
}

/**
 * Edits a mermaid block by acting on its diagram, in place of the rendered one.
 * Every gesture is written back into the fence as a minimal text edit, so the
 * source stays the one truth and undo, sync and the rest of the note see
 * nothing they would not see from typing.
 *
 * Kept outside what ProseMirror treats as content: `contentEditable={false}`
 * for the cursor, and the frame attribute for the events (see
 * `VISUAL_EDITOR_ATTRIBUTE`).
 */
export function MermaidVisualEditor({
	editor,
	getPos,
	code,
	onDone,
}: MermaidVisualEditorProps) {
	const frameRef = useRef<HTMLDivElement>(null)
	const { canvasRef, view, wysiwyg, selection, connecting } = useVisimerCanvas({
		editor,
		getPos,
		code,
		frameRef,
	})
	const selectedNode =
		selection.length === 1 && selection[0].startsWith(NODE_ENTITY_PREFIX)
			? selection[0]
			: undefined
	const anchor = useSelectedNodeAnchor({
		canvasRef,
		frameRef,
		nodeId: selectedNode,
	})

	function addNode() {
		view.current?.addNode()
	}

	function toggleConnect() {
		view.current?.setTool(connecting ? 'select' : 'connect')
	}

	function deleteSelection() {
		wysiwyg.current?.deleteEntities(selection, 'canvas')
	}

	function zoomBy(factor: number) {
		view.current?.zoomBy(factor)
	}

	function fitView() {
		view.current?.fitView()
	}

	function addNodeAfterSelected() {
		if (!selectedNode || !wysiwyg.current || !view.current) return
		addConnectedNode(wysiwyg.current, view.current, selectedNode)
	}

	return (
		<div
			ref={frameRef}
			contentEditable={false}
			{...{ [VISUAL_EDITOR_ATTRIBUTE]: '' }}
			className="not-typeset relative my-4 bg-pattern"
			onKeyDownCapture={keepSelectAllInLabel}
		>
			<div
				ref={canvasRef}
				data-testid="mermaid-visual-canvas"
				// The toolbar below replaces visimer's own corner zoom buttons.
				className="h-96 overflow-hidden [&_.mw-zoom-controls]:hidden!"
			/>
			{anchor ? (
				<AddNodeHandle anchor={anchor} onClick={addNodeAfterSelected} />
			) : null}
			<VisualEditorToolbar
				connecting={connecting}
				canDelete={selection.length > 0}
				onDone={onDone}
				onAddNode={addNode}
				onToggleConnect={toggleConnect}
				onDelete={deleteSelection}
				onZoom={zoomBy}
				onFit={fitView}
			/>
		</div>
	)
}
