import { cn } from 'cn'
import type { ComponentProps } from 'react'

import { ButtonToggle } from '#src/components/button-toggle'
import { useEditorStyles } from '#src/hooks/use-editor-styles'
import type { Style } from '#src/hooks/use-editor-styles'

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
