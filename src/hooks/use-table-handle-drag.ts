import { useCurrentEditor } from '@tiptap/react'
import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import type { TableAnchor } from '@/editor/table/geometry'
import type { TableAxis } from '@/editor/table/menu-items'

/** Below this the gesture is still a click, not a drag. */
const DRAG_THRESHOLD_PX = 4

type DragOptions = {
	axis: TableAxis
	anchor: TableAnchor
	/** Called when the pointer went down and up without ever moving. */
	onClick: () => void
}

/** The lines a drag can land between, one per row or column boundary. */
function boundaries(anchor: TableAnchor, axis: TableAxis): number[] {
	const rows = Array.from(anchor.table.rows)

	if (axis === 'row') {
		return rows.map((row) => row.getBoundingClientRect().top)
	}

	return Array.from(rows[0]?.cells ?? []).map(
		(cell) => cell.getBoundingClientRect().left
	)
}

/** Which row or column the pointer is currently over. */
function indexAt(anchor: TableAnchor, axis: TableAxis, position: number) {
	return boundaries(anchor, axis).reduce(
		(found, start, index) => (position >= start ? index : found),
		0
	)
}

/**
 * Dragging a table handle to reorder its row or column, and clicking it to open
 * its menu.
 *
 * One gesture serves both, the way the Notes app's handles do, so the click is
 * whatever a drag turns out not to be - decided on movement rather than on
 * timing, so a slow deliberate click still opens the menu.
 */
export function useTableHandleDrag({ axis, anchor, onClick }: DragOptions) {
	const { editor } = useCurrentEditor()
	const [targetIndex, setTargetIndex] = useState<number | null>(null)
	const start = useRef<{ x: number; y: number } | null>(null)
	const dragged = useRef(false)

	const from = anchor[axis].index

	const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
		event.preventDefault()
		event.currentTarget.setPointerCapture?.(event.pointerId)
		start.current = { x: event.clientX, y: event.clientY }
		// Cleared here rather than in the click that follows a drag: that click
		// does not always arrive, and a stale flag swallows the next one.
		dragged.current = false
	}

	const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
		if (!start.current) return

		const travelled = Math.hypot(
			event.clientX - start.current.x,
			event.clientY - start.current.y
		)
		if (travelled < DRAG_THRESHOLD_PX && targetIndex === null) return

		setTargetIndex(
			indexAt(anchor, axis, axis === 'row' ? event.clientY : event.clientX)
		)
	}

	const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
		event.currentTarget.releasePointerCapture?.(event.pointerId)
		start.current = null

		if (targetIndex === null) return

		if (targetIndex !== from) {
			const chain = editor?.chain().focus()
			if (axis === 'row') chain?.moveRow(from, targetIndex).run()
			else chain?.moveColumn(from, targetIndex).run()
		}

		dragged.current = true
		setTargetIndex(null)
	}

	// The browser can take the gesture away - a context menu, a lost capture -
	// and without this the drop indicator stays painted over the table and the
	// handle goes on dragging under the next pointer that crosses it.
	const handlePointerCancel = () => {
		start.current = null
		setTargetIndex(null)
	}

	// Opening on click rather than on pointer up: a drag ends in a click too, so
	// the gesture that just moved a column must not also open its menu.
	const handleClick = () => {
		if (!dragged.current) onClick()
	}

	return {
		/** Null unless a drag is under way. */
		targetIndex,
		/** Spread straight onto the handle button. */
		handleProps: {
			onPointerDown: handlePointerDown,
			onPointerMove: handlePointerMove,
			onPointerUp: handlePointerUp,
			onPointerCancel: handlePointerCancel,
			onClick: handleClick,
		},
	}
}
