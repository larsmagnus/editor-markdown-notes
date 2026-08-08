import { ChevronsUpDownIcon } from 'lucide-react'
import type { ComponentProps, Dispatch, SetStateAction } from 'react'
import { useState } from 'react'

import { DevFileSelectorList } from '@/components/dev-file-selector-list'
import { Button } from '@/components/ui/button'
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

	const selectFile = (selected: string) => {
		// Re-picking the open file clears the selection, the way a combobox
		// deselects.
		setValue(selected === value ? '' : selected)
		setOpen(false)
	}

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
				<DevFileSelectorList
					value={value}
					values={values}
					onSelect={selectFile}
				/>
			</PopoverContent>
		</Popover>
	)
}

export default DevFileSelector
