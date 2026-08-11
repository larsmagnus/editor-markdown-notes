import type { TableAnchor } from '@/editor/table/geometry'
import type { TableAxis } from '@/editor/table/menu-items'

interface TableDropIndicatorProps {
	axis: TableAxis
	anchor: TableAnchor
	/** The row or column the drag would land on. */
	index: number
}

/** Where a dragged row or column would land, drawn over that row or column. */
export function TableDropIndicator({
	axis,
	anchor,
	index,
}: TableDropIndicatorProps) {
	const rows = Array.from(anchor.table.rows)
	const target = axis === 'row' ? rows[index] : rows[0]?.cells[index]

	if (!target) return null

	const box = target.getBoundingClientRect()
	const style =
		axis === 'row'
			? {
					left: anchor.tableBox.left,
					top: box.top - anchor.origin.top,
					width: anchor.tableBox.width,
					height: box.height,
				}
			: {
					left: box.left - anchor.origin.left,
					top: anchor.tableBox.top,
					width: box.width,
					height: anchor.tableBox.height,
				}

	return (
		<div
			className="pointer-events-none absolute rounded-sm bg-accent/40 ring-2 ring-ring"
			style={style}
		/>
	)
}
