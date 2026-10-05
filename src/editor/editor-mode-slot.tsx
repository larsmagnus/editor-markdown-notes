import { cn } from 'cn'
import type { ReactNode } from 'react'

interface EditorModeSlotProps {
	active: boolean
	children: ReactNode
}

/**
 * A wrapper that either behaves as if it were not there, or hides its
 * subtree entirely.
 *
 * `display: contents` removes the wrapper from the box tree while active, so
 * the layout is exactly what it would be without this component - both slots
 * sit inside the same shared content column below, so neither mode's own
 * root needs to be a flex item itself. `hidden` removes the inactive one
 * from layout, the tab order and the accessibility tree instead.
 */
export function EditorModeSlot({ active, children }: EditorModeSlotProps) {
	return <div className={cn(active ? 'contents' : 'hidden')}>{children}</div>
}
