'use client'

import { CircleOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AskPopover } from '@/editor/ask-popover'
import { ButtonColor } from '@/editor/button-color'
import { ButtonStyle } from '@/editor/button-style'
import { ButtonUnlink } from '@/editor/button-unlink'
import { COLOR_SWATCHES } from '@/editor/color-swatches'
import { HeadingPopover } from '@/editor/heading-popover'
import { LinkPopover } from '@/editor/link-popover'
import { useEditorStyles } from '@/hooks/use-editor-styles'
import { useSettings } from '@/hooks/use-settings'

/** The bubble menu's controls for a text selection: heading, styles, link, colour, reset. */
export function TextBubbleControls() {
	const { reset } = useEditorStyles()
	const { isVSCodeContext } = useSettings()

	return (
		<div className="flex items-center gap-1 p-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-xs drop-shadow-lg w-[400px]">
			{isVSCodeContext && <AskPopover />}
			<HeadingPopover />

			<ButtonStyle style="bold" className="font-bold" />
			<ButtonStyle style="italic" className="italic" />
			<ButtonStyle style="strike" className="line-through" />

			<LinkPopover />

			<ButtonUnlink />

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
