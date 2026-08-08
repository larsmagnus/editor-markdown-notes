import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { useEditorTools } from '@/hooks/use-editor-tools'
import type { HeadingLevel } from '@/lib/heading-levels'
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
			variant="ghost"
			size="sm"
			// Both menus pass an icon as `children`, which leaves the button with no
			// accessible name of its own. `rest` still wins, so a caller can override.
			title={`Heading ${level}`}
			onClick={() => toggleHeadingByLevel(level)}
			className={cn(
				className,
				hasHeadingLevel(level)
					? 'is-active bg-accent text-accent-foreground'
					: ''
			)}
			{...rest}
		>
			{children ?? `H${level}`}
		</Button>
	)
}
