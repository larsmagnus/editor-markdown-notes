import { useCurrentEditor } from '@tiptap/react'
import { useState } from 'react'

import { ButtonHandle } from '@/editor/table/button-handle'
import { TableDropIndicator } from '@/editor/table/drop-indicator'
import type { TableAnchor } from '@/editor/table/geometry'
import { TableHandleMenu } from '@/editor/table/handle-menu'
import type { TableAxis, TableMenuItem } from '@/editor/table/menu-items'
import { useTableHandleDrag } from '@/hooks/use-table-handle-drag'

interface TableHandleProps {
	axis: TableAxis
	anchor: TableAnchor
}

/**
 * The ellipsis that sits above a column or beside a row.
 *
 * Clicking it opens that axis' menu, dragging it reorders the row or column -
 * one control for both, as in the Notes app.
 */
export function TableHandle({ axis, anchor }: TableHandleProps) {
	const { editor } = useCurrentEditor()
	const [open, setOpen] = useState(false)
	const openMenu = () => setOpen(true)
	const { targetIndex, handleProps } = useTableHandleDrag({
		axis,
		anchor,
		onClick: openMenu,
	})

	const { index, count, handle } = anchor[axis]

	const runItem = (item: TableMenuItem) => {
		if (editor) item.run(editor.chain().focus(), index).run()
		setOpen(false)
	}

	return (
		<>
			{targetIndex === null ? null : (
				<TableDropIndicator axis={axis} anchor={anchor} index={targetIndex} />
			)}
			<div
				className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
				style={{ left: handle.left, top: handle.top }}
			>
				<TableHandleMenu
					axis={axis}
					index={index}
					count={count}
					open={open}
					onOpenChange={setOpen}
					onSelect={runItem}
				>
					<ButtonHandle
						axis={axis}
						expanded={open}
						dragging={targetIndex !== null}
						{...handleProps}
					/>
				</TableHandleMenu>
			</div>
		</>
	)
}
