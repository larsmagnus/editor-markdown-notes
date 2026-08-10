import type { ComponentProps, Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
	ComboboxValue,
} from '@/components/ui/combobox'
import { cn } from '@/lib/utils'

export type DevFileSelectorProps = {
	value: string
	setValue: Dispatch<SetStateAction<string>>
	values: { value: string; label: string }[]
} & ComponentProps<'button'>

type FileOption = DevFileSelectorProps['values'][number]

/**
 * Switches between the demo notes in `public/`. Development web-view only
 */
function DevFileSelector({
	className,
	values,
	value,
	setValue,
}: DevFileSelectorProps) {
	const selected = values.find((item) => item.value === value) ?? null

	const selectFile = (item: FileOption | null) => {
		// Re-picking the open file clears the selection, the way a combobox
		// deselects.
		setValue(item && item.value !== value ? item.value : '')
	}

	return (
		<Combobox items={values} value={selected} onValueChange={selectFile}>
			<ComboboxTrigger
				render={
					<Button
						variant="outline"
						className={cn('w-[200px] justify-between', className)}
					/>
				}
			>
				<ComboboxValue placeholder="Select file..." />
			</ComboboxTrigger>
			<ComboboxContent>
				<ComboboxInput placeholder="Search files..." showTrigger={false} />
				<ComboboxEmpty>No file found.</ComboboxEmpty>
				<ComboboxList>
					{(item: FileOption) => (
						<ComboboxItem key={item.value} value={item}>
							{item.label}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	)
}

export default DevFileSelector
