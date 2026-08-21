import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ButtonToggleProps = ComponentProps<'button'> & {
	active: boolean
	/** Extra classes applied only while `active`, e.g. a heading level's
	 *  background - `is-active` alone is always added. */
	activeClassName?: string
}

/**
 * The ghost, `is-active`-on-toggle button shared by every editor toolbar
 * control that's either on or off - text style, heading level, color, link.
 */
export function ButtonToggle({
	active,
	activeClassName,
	className,
	...rest
}: ButtonToggleProps) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			className={cn(className, active && cn('is-active', activeClassName))}
			{...rest}
		/>
	)
}
