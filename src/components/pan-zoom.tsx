import type { ReactNode } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

import { cn } from '@/lib/utils'

type PanZoomProps = {
	children: ReactNode
	/**
	 * Rendered above the viewport, outside the transformed content so it stays
	 * put while the content moves. Anything in here may call the library's
	 * `useControls()` - it sits inside the same provider the viewport does.
	 */
	controls?: ReactNode
	/** Applied to the viewport - give it the bounds to clip against, e.g. a
	 *  `max-h-*`. */
	className?: string
}

/**
 * Ctrl or Cmd, whichever the platform puts under the reader's thumb - and a
 * trackpad pinch, which browsers report as a ctrl-held wheel.
 *
 * A predicate rather than the `['Control', 'Meta']` the prop also accepts:
 * the library requires *every* key in a plain list, so that pair would only
 * zoom while both were held.
 */
function isZoomModifierPressed(pressedKeys: string[]): boolean {
	return pressedKeys.includes('Control') || pressedKeys.includes('Meta')
}

/**
 * A zoomable, pannable viewport for oversized media - a diagram, an image, a
 * screenshot too wide for the prose column.
 *
 * Deliberately media-agnostic: it knows nothing about what it frames beyond
 * that it may be larger than the space available for it.
 */
export function PanZoom({ children, controls, className }: PanZoomProps) {
	return (
		<TransformWrapper
			minScale={1}
			maxScale={4}
			limitToBounds
			// A bare wheel over the viewport has to keep scrolling the document -
			// it sits mid-note, and swallowing the scroll would trap the reader in
			// it. Ctrl/Cmd+wheel is the zoom gesture instead.
			wheel={{ activationKeys: isZoomModifierPressed }}
			// Double-click is a text-selection gesture everywhere else in the
			// editor; zooming on it would steal that from a ProseMirror node view.
			doubleClick={{ disabled: true }}
		>
			<div className="relative">
				{/* The library's own wrapper is the element that clips, and the one
				    it measures pan bounds against, so the caller's bounds go on it
				    rather than on a container of ours - a separate clipping box
				    outside it would leave those bounds measured against the wrong
				    rectangle. It sizes to its content by default, hence `w-full`.

				    Centring is the content row's job (`justify-center`) rather than
				    the transform's: `centerOnInit` centres vertically too, which
				    opens anything taller than the viewport at its middle. */}
				<TransformComponent
					wrapperClass={cn('w-full!', className)}
					contentClass="w-full! justify-center!"
				>
					{children}
				</TransformComponent>

				{controls}
			</div>
		</TransformWrapper>
	)
}
