import { lazy, Suspense } from 'react'

import type { DevFileSelectorProps } from '@/components/dev-file-selector'
import ThemeToggle from '@/components/theme-toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
	fromToggleValues,
	toToggleValues,
	VIEW_TOGGLES,
} from '@/components/view-toggle-options'
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
				value={toToggleValues(viewOptions)}
				onValueChange={(values) => setViewOptions(fromToggleValues(values))}
			>
				{VIEW_TOGGLES.map(({ value, key, label, on: On, off: Off }) => (
					<ToggleGroupItem key={value} value={value} aria-label={label}>
						{viewOptions[key] ? <On /> : <Off />}
					</ToggleGroupItem>
				))}
			</ToggleGroup>

			<ThemeToggle />
		</div>
	)
}

export default Toolbar
