import { Code, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import type { ReactZoomPanPinchContextState } from 'react-zoom-pan-pinch'
import { useControls, useTransformComponent } from 'react-zoom-pan-pinch'

import { MermaidActionsButton } from '@/editor/mermaid/actions-button'
import { NodeActionButton } from '@/editor/node-action-button'

/** `useTransformComponent` keeps its callback in a dependency array, so this
 *  has to be one stable function rather than a closure built per render. */
function selectScale(ref: ReactZoomPanPinchContextState) {
	return ref.state.scale
}

type MermaidToolbarProps = {
	/** The block's mermaid source. */
	code: string
	/** The diagram mermaid rendered from `code`. */
	svg: string
	/** Opens the block's source. Clicking the diagram no longer does - a click
	 *  there is the start of a pan. */
	onEdit: () => void
}

/**
 * The controls that appear over a rendered diagram: zoom, back to fit, edit
 * the source, and hand the diagram somewhere else.
 *
 * Renders inside `PanZoom`, which is what lets it drive the viewport.
 */
export function MermaidToolbar({ code, svg, onEdit }: MermaidToolbarProps) {
	const { zoomIn, zoomOut, resetTransform } = useControls()
	// At the starting scale there is nothing to zoom out of or reset to, and a
	// toolbar that says otherwise reads as broken.
	const isZoomed = useTransformComponent(selectScale) > 1

	// Each handler drops its click event: these all take a step size first.
	function handleZoomIn() {
		zoomIn()
	}

	function handleZoomOut() {
		zoomOut()
	}

	function handleReset() {
		resetTransform()
	}

	return (
		<div
			contentEditable={false}
			className="absolute top-2 right-2 flex items-center gap-0.5 rounded-lg border border-border bg-background/90 p-0.5 opacity-0 shadow-sm backdrop-blur-xs transition-opacity group-hover:opacity-100 focus-within:opacity-100"
		>
			<NodeActionButton
				icon={<ZoomOut />}
				label="Zoom out"
				disabled={!isZoomed}
				onClick={handleZoomOut}
			/>
			<NodeActionButton
				icon={<ZoomIn />}
				label="Zoom in"
				onClick={handleZoomIn}
			/>
			<NodeActionButton
				icon={<RotateCcw />}
				label="Reset zoom"
				disabled={!isZoomed}
				onClick={handleReset}
			/>
			<NodeActionButton
				icon={<Code />}
				label="Edit diagram source"
				tooltip="Edit source"
				onClick={onEdit}
			/>

			<MermaidActionsButton code={code} svg={svg} />
		</div>
	)
}
