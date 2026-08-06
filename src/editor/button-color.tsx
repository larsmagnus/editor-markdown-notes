import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { useEditorTools } from '@/hooks/use-editor-tools'
import { cn } from '@/lib/utils'

export function ButtonColor({
	className,
	color,
	children,
	...rest
}: ComponentProps<'button'> & {
	color: string
}) {
	const { toggleTextColor, hasTextColor } = useEditorTools()

	return (
		<Button
			type="button"
			variant="ghost"
			title="Set color"
			size="sm"
			onClick={() => toggleTextColor(color)}
			className={cn(
				'w-5 h-5 p-0',
				className,
				hasTextColor(color) ? 'is-active' : ''
			)}
			{...rest}
		>
			{children}
		</Button>
	)
}
