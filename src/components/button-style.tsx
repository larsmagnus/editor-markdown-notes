import type { ComponentProps } from 'react'

import { ButtonToggle } from '@/components/button-toggle'
import { useEditorStyles } from '@/hooks/use-editor-styles'
import type { Style } from '@/hooks/use-editor-styles'
import { cn } from '@/lib/utils'

export function ButtonStyle({
	className,
	style,
	children,
	...rest
}: ComponentProps<'button'> & {
	style: Style
}) {
	const { toggleStyle, hasStyle, canToggleStyle } = useEditorStyles()

	return (
		<ButtonToggle
			active={hasStyle(style)}
			title={style}
			onClick={() => toggleStyle(style)}
			className={cn('capitalize', className)}
			disabled={!canToggleStyle(style)}
			{...rest}
		>
			{children ?? style}
		</ButtonToggle>
	)
}
