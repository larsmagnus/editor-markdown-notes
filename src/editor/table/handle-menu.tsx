import type { ReactNode } from 'react'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TableMenuAction } from '@/editor/table/menu-action'
import { TABLE_MENU_ITEMS } from '@/editor/table/menu-items'
import type { TableAxis, TableMenuItem } from '@/editor/table/menu-items'

interface TableHandleMenuProps {
	axis: TableAxis
	/** The row or column the handle points at, and how many there are. */
	index: number
	count: number
	open: boolean
	onOpenChange: (open: boolean) => void
	onSelect: (item: TableMenuItem) => void
	/** The handle button the menu belongs to. */
	children: ReactNode
}

/**
 * The row or column actions, opened by its handle.
 *
 * Anchored to a span covering the handle rather than to the handle itself,
 * because Base UI's trigger opens on mouse down and the button has to keep that
 * gesture free for the drag to be able to start at all.
 */
export function TableHandleMenu({
	axis,
	index,
	count,
	open,
	onOpenChange,
	onSelect,
	children,
}: TableHandleMenuProps) {
	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange}>
			<DropdownMenuTrigger
				render={
					<span aria-hidden className="pointer-events-none absolute inset-0" />
				}
			/>
			{children}
			<DropdownMenuContent align="start" className="w-auto min-w-44">
				{TABLE_MENU_ITEMS[axis].map((item) => (
					<TableMenuAction
						key={item.label}
						item={item}
						disabled={!(item.enabled?.(index, count) ?? true)}
						onSelect={onSelect}
					/>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
