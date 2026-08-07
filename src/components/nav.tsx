import { Eye, EyeClosed, Maximize2, Minimize2 } from 'lucide-react'
import { lazy, Suspense } from 'react'

import type { DevFileSelectorProps } from '@/components/dev-file-selector'
import ThemeToggle from '@/components/theme-toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSettings } from '@/hooks/use-settings'

const DevFileSelector = import.meta.env.DEV
	? lazy(() => import('@/components/dev-file-selector'))
	: null

type NavProps = {
	files: DevFileSelectorProps['values']
	fileName: string
	setFileName: DevFileSelectorProps['setValue']
}

function Nav({ files, fileName, setFileName }: NavProps) {
	const { viewOptions, setViewOptions, isVSCodeContext } = useSettings()

	const value: string[] = []
	if (viewOptions.raw) value.push('raw')
	if (viewOptions.fullWidth) value.push('max-w-full')

	return (
		<nav className="sticky top-0 left-0 bg-background/20 backdrop-blur-md p-3 flex gap-2 items-center z-10">
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
