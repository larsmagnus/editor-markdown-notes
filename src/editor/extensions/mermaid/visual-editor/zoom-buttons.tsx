import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

import { ButtonAction } from '#src/components/button-action'

/** The step visimer's own corner zoom buttons take. */
const ZOOM_STEP = 1.25

type ZoomButtonsProps = {
	onZoom: (factor: number) => void
	onFit: () => void
}

/** The zoom controls of the diagram's own toolbar, driving visimer's viewport. */
export function ZoomButtons({ onZoom, onFit }: ZoomButtonsProps) {
	function zoomOut() {
		onZoom(1 / ZOOM_STEP)
	}

	function zoomIn() {
		onZoom(ZOOM_STEP)
	}

	return (
		<>
			<ButtonAction icon={<ZoomOut />} label="Zoom out" onClick={zoomOut} />
			<ButtonAction icon={<ZoomIn />} label="Zoom in" onClick={zoomIn} />
			<ButtonAction icon={<RotateCcw />} label="Reset zoom" onClick={onFit} />
		</>
	)
}
