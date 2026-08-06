import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { useEditorTools } from '@/hooks/use-editor-tools'
import type { HeadingLevel } from '@/hooks/use-editor-tools'
import { cn } from '@/lib/utils'

export function ButtonHeading({
	level,
	className,
	children,
	...rest
}: ComponentProps<'button'> & {
	level: HeadingLevel
}) {
	const { toggleHeadingByLevel, hasHeadingLevel } = useEditorTools()

	return (
		<Button
			type="button"
			onClick={() => toggleHeadingByLevel(level)}
			className={cn(className, hasHeadingLevel(level) ? 'is-active' : '')}
			{...rest}
		>
			{children ?? `H${level}`}
		</Button>
	)
}
