import { CheckIcon } from 'lucide-react'

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

type DevFileSelectorListProps = {
	value: string
	values: { value: string; label: string }[]
	onSelect: (value: string) => void
}

/** The searchable list of demo notes inside the selector's popover. */
export function DevFileSelectorList({
	value,
	values,
	onSelect,
}: DevFileSelectorListProps) {
	return (
		<Command>
			<CommandInput placeholder="Search files..." />
			<CommandList>
				<CommandEmpty>No file found.</CommandEmpty>
				<CommandGroup>
					{values.map((item) => (
						<CommandItem
							key={item.value}
							value={item.value}
							onSelect={onSelect}
						>
							<CheckIcon
								className={cn(
									'mr-2 h-4 w-4',
									value === item.value ? 'opacity-100' : 'opacity-0'
								)}
							/>
							{item.label}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	)
}
