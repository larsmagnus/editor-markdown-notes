import { TableDropIndicator } from '#src/editor/extensions/table/drop-indicator'
import type { TableAnchor } from '#src/editor/extensions/table/geometry'
import type { TableAxis } from '#src/editor/extensions/table/menu-items'

interface OptionalTableDropIndicatorProps {
	axis: TableAxis
	anchor: TableAnchor
	index: number | null
}

export function OptionalTableDropIndicator({
	axis,
	anchor,
	index,
}: OptionalTableDropIndicatorProps) {
	return index === null ? null : (
		<TableDropIndicator axis={axis} anchor={anchor} index={index} />
	)
}
