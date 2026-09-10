import { CircleOff } from 'lucide-react'

import { ButtonColor } from '#src/components/button-color'
import { ButtonStyle } from '#src/components/button-style'
import { ButtonUnlink } from '#src/components/button-unlink'
import { HeadingPopover } from '#src/components/heading-popover'
import { LinkPopover } from '#src/components/link-popover'
import { Button } from '#src/components/ui/button'
import { AskPopover } from '#src/editor/extensions/ask/ask-popover'
import { useEditorColor } from '#src/hooks/use-editor-color'
import { useSettings } from '#src/hooks/use-settings'
import { COLOR_SWATCHES } from '#src/lib/color-swatches'

/** The bubble menu's controls for a text selection: heading, styles, link, colour, reset. */
export function TextBubbleControls() {
	const { resetTextColor } = useEditorColor()
	const { isVSCodeContext } = useSettings()

	return (
		<div className="flex items-center gap-1 p-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-xs drop-shadow-lg w-fit">
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
				title="Clear color"
				onClick={resetTextColor}
			>
				<CircleOff className="size-4" />
			</Button>
		</div>
	)
}
