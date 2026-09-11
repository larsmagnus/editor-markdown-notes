import { cn } from 'cn'

import { PAN_ZOOM_FRAME_CLASSNAME } from '#src/components/pan-zoom-frame'

/**
 * `min-w`/`min-h` floor the frame to the toolbar's own size, so a small image
 * doesn't spill it off the page edge. `softFocused` reuses the same ring
 * tokens `focus-within` gets in `PAN_ZOOM_FRAME_CLASSNAME`, for a caret
 * merely adjacent rather than real DOM focus inside the toolbar.
 */
export function imageFrameClassName(softFocused: boolean): string {
	return cn(
		PAN_ZOOM_FRAME_CLASSNAME,
		'max-h-[32rem] min-w-40 min-h-14',
		softFocused && 'border-ring ring-2 ring-ring/50'
	)
}
