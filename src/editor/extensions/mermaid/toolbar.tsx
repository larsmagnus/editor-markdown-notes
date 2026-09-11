import { Code, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import type { ReactZoomPanPinchContextState } from 'react-zoom-pan-pinch'
import { useControls, useTransformComponent } from 'react-zoom-pan-pinch'

import { ButtonAction } from '#src/components/button-action'
import { OverlayToolbar } from '#src/components/overlay-toolbar'
import { PAN_ZOOM_MIN_SCALE } from '#src/components/pan-zoom'
import { ButtonActions } from '#src/editor/extensions/mermaid/button-actions'

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
	const scale = useTransformComponent(selectScale)
	// Nothing to reset to at the starting scale, and nothing further to zoom
	// out of once the floor is reached - either reads as broken if left enabled.
	const canReset = scale !== 1
	const canZoomOut = scale > PAN_ZOOM_MIN_SCALE

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
		<OverlayToolbar>
			<ButtonAction
				icon={<ZoomOut />}
				label="Zoom out"
				disabled={!canZoomOut}
				onClick={handleZoomOut}
			/>
			<ButtonAction icon={<ZoomIn />} label="Zoom in" onClick={handleZoomIn} />
			<ButtonAction
				icon={<RotateCcw />}
				label="Reset zoom"
				disabled={!canReset}
				onClick={handleReset}
			/>
			<ButtonAction
				icon={<Code />}
				label="Edit diagram source"
				tooltip="Edit source"
				onClick={onEdit}
			/>

			<ButtonActions code={code} svg={svg} />
		</OverlayToolbar>
	)
}
