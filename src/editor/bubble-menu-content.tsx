'use client'

import { CircleOff, Unlink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ButtonColor } from '@/editor/button-color'
import { ButtonStyle } from '@/editor/button-style'
import { COLOR_SWATCHES } from '@/editor/color-swatches'
import { HeadingPopover } from '@/editor/heading-popover'
import { LinkPopover } from '@/editor/link-popover'
import { useEditorLink } from '@/hooks/use-editor-link'
import { useEditorStyles } from '@/hooks/use-editor-styles'
import { cn } from '@/lib/utils'

/**
 * The formatting controls themselves, separate from the bubble that positions
 * them. `BubbleMenu` measures the DOM through floating-ui, which happy-dom
 * cannot do, so this split is what makes the controls testable at all.
 */
export function BubbleMenuContent() {
	const { reset } = useEditorStyles()
	const { isLinkActive, unsetLink } = useEditorLink()

	return (
		<div className="flex items-center gap-1 p-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-xs drop-shadow-lg w-[400px]">
			<HeadingPopover />

			<ButtonStyle style="bold" className="font-bold" />
			<ButtonStyle style="italic" className="italic" />
			<ButtonStyle style="strike" className="line-through" />

			<LinkPopover />

			<Button
				type="button"
				variant="ghost"
				size="sm"
				title="Unlink"
				onClick={() => unsetLink()}
				className={cn('font-bold', isLinkActive() ? 'is-active' : '')}
			>
				<Unlink className="size-4" />
			</Button>

			{COLOR_SWATCHES.map(({ color, className }) => (
				<ButtonColor key={color} className={className} color={color} />
			))}

			<Button
				type="button"
				variant="ghost"
				size="sm"
				title="Reset all styles and formatting"
				onClick={reset}
			>
				<CircleOff className="size-4" />
			</Button>
		</div>
	)
}
