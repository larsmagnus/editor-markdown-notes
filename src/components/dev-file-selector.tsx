import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import type { ComponentProps, Dispatch, SetStateAction } from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type DevFileSelectorProps = {
	value: string
	setValue: Dispatch<SetStateAction<string>>
	values: { value: string; label: string }[]
} & ComponentProps<'button'>

/**
 * Switches between the demo notes in `public/`. Development web-view only
 */
function DevFileSelector({
	className,
	values,
	value,
	setValue,
}: DevFileSelectorProps) {
	const [open, setOpen] = useState(false)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn('w-[200px] justify-between', className)}
				>
					{value
						? values.find((item) => item.value === value)?.label
						: 'Select file...'}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search files..." />
					<CommandList>
						<CommandEmpty>No file found.</CommandEmpty>
						<CommandGroup>
							{values.map((item) => (
								<CommandItem
									key={item.value}
									value={item.value}
									onSelect={(currentValue) => {
										setValue(currentValue === value ? '' : currentValue)
										setOpen(false)
									}}
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
			</PopoverContent>
		</Popover>
	)
}

export default DevFileSelector
