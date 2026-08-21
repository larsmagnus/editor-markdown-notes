import { Heading } from 'lucide-react'

import { PopoverArrow } from '@/components/popover-arrow'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { ButtonHeadingGroup } from '@/editor/button-heading-group'
import { PopoverIconTrigger } from '@/editor/popover-icon-trigger'

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
