import type { ComponentProps } from 'react'

import { ButtonToggle } from '@/components/button-toggle'
import { useEditorColor } from '@/hooks/use-editor-color'
import { cn } from '@/lib/utils'

export function ButtonColor({
	className,
	color,
	children,
	...rest
}: ComponentProps<'button'> & {
	color: string
}) {
	const { toggleTextColor, hasTextColor } = useEditorColor()

	return (
		<ButtonToggle
			active={hasTextColor(color)}
			title="Set color"
			onClick={() => toggleTextColor(color)}
			className={cn('w-5 h-5 p-0', className)}
			{...rest}
		>
			{children}
		</ButtonToggle>
	)
}
