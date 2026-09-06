import type { MouseEvent, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type OverlayToolbarProps = {
	children: ReactNode
	/** Forces the toolbar visible outside of hover/focus - a node view's own
	 *  reason to reveal it, e.g. an adjacent caret. */
	visible?: boolean
}

/**
 * A linked image's `<a>` wraps the whole node view, toolbar included, so a
 * toolbar click is also a click inside a real anchor - the browser's native
 * "open this link" fires regardless of any JS. Capture phase, checked
 * against the DOM: bubble is too late once a handler like unlink has already
 * removed the `<a>` from the DOM, and a React-tree check would also catch
 * the Link popover's own submit button (a React child that portals
 * elsewhere in the DOM).
 */
function preventAnchorNavigation(event: MouseEvent) {
	if (event.target instanceof Element && event.target.closest('a')) {
		event.preventDefault()
	}
}

/**
 * The hover/focus-reveal chrome a node view's floating controls share -
 * mermaid's diagram and an image alike. Always `contentEditable={false}`:
 * these render inside a ProseMirror node view, and without it the
 * cursor/selection would treat the toolbar as editable document content.
 */
export function OverlayToolbar({ children, visible }: OverlayToolbarProps) {
	return (
		<div
			contentEditable={false}
			onClickCapture={preventAnchorNavigation}
			className={cn(
				'absolute top-2 right-2 flex items-center gap-0.5 rounded-lg border border-border bg-background/90 p-0.5 opacity-0 shadow-sm backdrop-blur-xs transition-opacity group-hover:opacity-100 focus-within:opacity-100',
				visible && 'opacity-100'
			)}
		>
			{children}
		</div>
	)
}
