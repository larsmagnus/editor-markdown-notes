import { Heading } from 'lucide-react'

import { PopoverArrow } from '@/components/popover-arrow'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { ButtonHeadingGroup } from '@/editor/button-heading-group'

/** The six heading levels, behind one button in the bubble menu. */
export function HeadingPopover() {
	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button type="button" variant="ghost" size="sm" title="Heading">
						<Heading className="size-4" />
					</Button>
				}
			/>
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
