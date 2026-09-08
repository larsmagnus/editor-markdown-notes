import { Heading } from 'lucide-react'

import { ButtonHeadingGroup } from '#src/components/button-heading-group'
import { PopoverArrow } from '#src/components/popover-arrow'
import { PopoverIconTrigger } from '#src/components/popover-icon-trigger'
import { Popover, PopoverContent } from '#src/components/ui/popover'

/** The six heading levels, behind one button in the bubble menu. */
export function HeadingPopover() {
	return (
		<Popover>
			<PopoverIconTrigger icon={Heading} title="Heading" />
			<PopoverContent
				side="top"
				sideOffset={12}
				className="w-auto p-2 flex gap-1"
			>
				<ButtonHeadingGroup withIcons />
				<PopoverArrow />
			</PopoverContent>
		</Popover>
	)
}
