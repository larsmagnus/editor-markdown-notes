import type { ComponentProps } from 'react'

import { ButtonToggle } from '#src/components/button-toggle'
import { useEditorHeadings } from '#src/hooks/use-editor-headings'
import type { HeadingLevel } from '#src/lib/heading-levels'

export function ButtonHeading({
	level,
	children,
	...rest
}: ComponentProps<'button'> & {
	level: HeadingLevel
}) {
	const { toggleHeading, hasHeading } = useEditorHeadings()

	return (
		<ButtonToggle
			active={hasHeading(level)}
			activeClassName="bg-accent text-accent-foreground"
			// Both menus pass an icon as `children`, which leaves the button with no
			// accessible name of its own. `rest` still wins, so a caller can override.
			title={`Heading ${level}`}
			onClick={() => toggleHeading(level)}
			{...rest}
		>
			{children ?? `H${level}`}
		</ButtonToggle>
	)
}
