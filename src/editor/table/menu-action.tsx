import { Fragment } from 'react'

import {
	DropdownMenuItem,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { TableMenuItem } from '@/editor/table/menu-items'

interface TableMenuActionProps {
	item: TableMenuItem
	/** Greyed out rather than hidden, so the menu keeps its shape. */
	disabled: boolean
	onSelect: (item: TableMenuItem) => void
}

/** One entry of a table handle's menu, with the rule that may precede it. */
export function TableMenuAction({
	item,
	disabled,
	onSelect,
}: TableMenuActionProps) {
	const handleClick = () => onSelect(item)

	return (
		<Fragment>
			{item.startsGroup ? <DropdownMenuSeparator /> : null}
			<DropdownMenuItem
				variant={item.destructive ? 'destructive' : 'default'}
				disabled={disabled}
				onClick={handleClick}
			>
				<item.icon />
				{item.label}
			</DropdownMenuItem>
		</Fragment>
	)
}
