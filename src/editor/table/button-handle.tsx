import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { TABLE_AXES } from '@/editor/table/menu-items'
import type { TableAxis } from '@/editor/table/menu-items'
import { cn } from '@/lib/utils'

interface ButtonHandleProps extends ComponentProps<'button'> {
	axis: TableAxis
	/** Whether the handle's menu is open, and whether a drag is under way. */
	expanded: boolean
	dragging: boolean
}

/**
 * The pill a table handle is drawn as, taking its ellipsis and its shape from
 * `TABLE_AXES` - the row's is the column's turned on its side, so the two read
 * as one control seen from two directions.
 */
export function ButtonHandle({
	axis,
	expanded,
	dragging,
	...rest
}: ButtonHandleProps) {
	const { label, icon: Icon, shape } = TABLE_AXES[axis]

	return (
		<Button
			type="button"
			variant="secondary"
			size="sm"
			aria-label={label}
			aria-haspopup="menu"
			aria-expanded={expanded}
			data-dragging={dragging ? '' : undefined}
			className={cn(
				shape,
				'cursor-grab touch-none rounded-full p-0 shadow-sm ring-1 ring-border data-dragging:cursor-grabbing'
			)}
			{...rest}
		>
			<Icon className="size-3.5" />
		</Button>
	)
}
