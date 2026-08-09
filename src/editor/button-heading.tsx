import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { useEditorHeadings } from '@/hooks/use-editor-headings'
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
	const { toggleHeading, hasHeading } = useEditorHeadings()

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			// Both menus pass an icon as `children`, which leaves the button with no
			// accessible name of its own. `rest` still wins, so a caller can override.
			title={`Heading ${level}`}
			onClick={() => toggleHeading(level)}
			className={cn(
				className,
				hasHeading(level) ? 'is-active bg-accent text-accent-foreground' : ''
			)}
			{...rest}
		>
			{children ?? `H${level}`}
		</Button>
	)
}
