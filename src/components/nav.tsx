import { Eye, EyeClosed, Maximize2, Minimize2 } from 'lucide-react'
import type { ComponentProps } from 'react'

import { Combobox } from '@/components/combobox'
import ThemeToggle from '@/components/theme-toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSettings } from '@/hooks/use-settings'

type ComboboxProps = ComponentProps<typeof Combobox>

type NavProps = {
	files: ComboboxProps['values']
	fileName: string
	setFileName: ComboboxProps['setValue']
}

function Nav({ files, fileName, setFileName }: NavProps) {
	const { viewOptions, setViewOptions, isVSCodeContext } = useSettings()

	const value: string[] = []
	if (viewOptions.raw) value.push('raw')
	if (viewOptions.fullWidth) value.push('max-w-full')

	return (
		<nav className="sticky top-0 left-0 bg-background/20 backdrop-blur-md p-3 flex gap-2 items-center">
			{/* VS Code owns file switching via its own tabs. */}
			{!isVSCodeContext && (
				<Combobox values={files} value={fileName} setValue={setFileName} />
			)}

			<ToggleGroup
				type="multiple"
				value={value}
				onValueChange={(values) =>
					setViewOptions({
						raw: values.includes('raw'),
						fullWidth: values.includes('max-w-full'),
					})
				}
			>
				<ToggleGroupItem value="raw" aria-label="Toggle raw markdown">
					{viewOptions.raw ? <EyeClosed /> : <Eye />}
				</ToggleGroupItem>
				<ToggleGroupItem value="max-w-full" aria-label="Toggle full width">
					{viewOptions.fullWidth ? <Maximize2 /> : <Minimize2 />}
				</ToggleGroupItem>
			</ToggleGroup>

			<ThemeToggle />
		</nav>
	)
}

export default Nav
