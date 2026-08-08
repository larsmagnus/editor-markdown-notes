import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
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
		<Button
			type="button"
			variant="ghost"
			size="sm"
			title={style}
			onClick={() => toggleStyle(style)}
			className={cn(
				'capitalize',
				className,
				hasStyle(style) ? 'is-active' : ''
			)}
			disabled={!canToggleStyle(style)}
			{...rest}
		>
			{children ?? style}
		</Button>
	)
}
