import { Heading } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverArrow,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { HeadingButtons } from '@/editor/heading-buttons'

/** The six heading levels, behind one button in the bubble menu. */
export function HeadingPopover() {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button type="button" variant="ghost" size="sm" title="Heading">
					<Heading className="size-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				side="top"
				sideOffset={12}
				className="w-auto p-2 flex gap-1"
			>
				<HeadingButtons withIcons />
				<PopoverArrow className="fill-popover" />
			</PopoverContent>
		</Popover>
	)
}
