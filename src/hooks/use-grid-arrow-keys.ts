import type { KeyboardEvent, RefObject } from 'react'
import { useCallback } from 'react'

type ColumnStep = (columns: number) => number

const STEPS: Record<string, ColumnStep> = {
	ArrowLeft: () => -1,
	ArrowRight: () => 1,
	ArrowUp: (columns) => -columns,
	ArrowDown: (columns) => columns,
}

/**
 * Moves focus between a CSS grid's buttons with the arrow keys, a row at a
 * time vertically. The column count is read from the grid's computed layout
 * on each keypress, since a responsive grid changes it with the viewport.
 */
export function useGridArrowKeys(gridRef: RefObject<HTMLElement | null>) {
	return useCallback(
		(event: KeyboardEvent) => {
			const step = STEPS[event.key]
			const grid = gridRef.current
			if (!step || !grid) return

			const cells = [...grid.querySelectorAll('button')]
			const from = cells.findIndex((cell) => cell === document.activeElement)
			const columns = getComputedStyle(grid)
				.gridTemplateColumns.split(' ')
				.filter(Boolean).length
			const target = cells[from + step(Math.max(columns, 1))]
			if (from === -1 || !target) return

			event.preventDefault()
			target.focus()
		},
		[gridRef]
	)
}
