import { Eye, EyeClosed, Maximize2, Minimize2, SpellCheck } from 'lucide-react'
import { lazy, Suspense } from 'react'

import type { DevFileSelectorProps } from '@/components/dev-file-selector'
import ThemeToggle from '@/components/theme-toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSettings } from '@/hooks/use-settings'

const DevFileSelector = import.meta.env.DEV
	? lazy(() => import('@/components/dev-file-selector'))
	: null

type ToolbarProps = {
	files: DevFileSelectorProps['values']
	fileName: string
	setFileName: DevFileSelectorProps['setValue']
}

function Toolbar({ files, fileName, setFileName }: ToolbarProps) {
	const { viewOptions, setViewOptions, isVSCodeContext } = useSettings()

	// `onValueChange` below rebuilds every key from this array, so a toggle
	// missing from either side gets reset the next time any other one is used.
	const value: string[] = []
	if (viewOptions.raw) value.push('raw')
	if (viewOptions.fullWidth) value.push('max-w-full')
	if (viewOptions.textTools) value.push('text-tools')

	return (
		<div
			role="toolbar"
			className="sticky top-0 left-0 bg-background/20 backdrop-blur-md p-3 flex gap-2 items-center z-10"
		>
			{DevFileSelector && !isVSCodeContext && (
				<Suspense fallback={null}>
					<DevFileSelector
						values={files}
						value={fileName}
						setValue={setFileName}
					/>
				</Suspense>
			)}

			<ToggleGroup
				type="multiple"
				value={value}
				onValueChange={(values) =>
					setViewOptions({
						raw: values.includes('raw'),
						fullWidth: values.includes('max-w-full'),
						textTools: values.includes('text-tools'),
					})
				}
			>
				<ToggleGroupItem value="raw" aria-label="Toggle raw markdown">
					{viewOptions.raw ? <EyeClosed /> : <Eye />}
				</ToggleGroupItem>
				<ToggleGroupItem value="max-w-full" aria-label="Toggle full width">
					{viewOptions.fullWidth ? <Maximize2 /> : <Minimize2 />}
				</ToggleGroupItem>
				<ToggleGroupItem value="text-tools" aria-label="Toggle text tools">
					<SpellCheck />
				</ToggleGroupItem>
			</ToggleGroup>

			<ThemeToggle />
		</div>
	)
}

export default Toolbar
