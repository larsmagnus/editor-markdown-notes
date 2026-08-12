import { lazy, Suspense } from 'react'

import { ButtonCopy } from '@/components/button-copy'
import type { DevFileSelectorProps } from '@/components/dev-file-selector'
import {
	editModeFromViewOptions,
	EDIT_MODE_OPTIONS,
} from '@/components/edit-mode-options'
import ThemeToggle from '@/components/theme-toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
	fromToggleValues,
	toToggleValues,
	VIEW_TOGGLES,
} from '@/components/view-toggle-options'
import { useSettings } from '@/hooks/use-settings'
import { getVSCodeApi } from '@/lib/vscode-api'

const DevFileSelector = import.meta.env.DEV
	? lazy(() => import('@/components/dev-file-selector'))
	: null

type ToolbarProps = {
	files: DevFileSelectorProps['values']
	fileName: string
	setFileName: DevFileSelectorProps['setValue']
	content: string
}

function Toolbar({ files, fileName, setFileName, content }: ToolbarProps) {
	const { viewOptions, setViewOptions, isVSCodeContext } = useSettings()

	const editModeOptions = isVSCodeContext
		? EDIT_MODE_OPTIONS
		: EDIT_MODE_OPTIONS.filter((option) => option.value !== 'text')

	// Re-clicking the active item empties the array; ignore that so the group
	// always shows raw or live as selected. 'text' never becomes the persisted
	// mode - the webview may be gone by the time the host has acted on it.
	function handleEditModeChange(values: string[]) {
		const [value] = values
		if (!value) return
		if (value === 'text') {
			getVSCodeApi()?.postMessage({ type: 'openInTextEditor' })
			return
		}
		setViewOptions({ raw: value === 'raw' })
	}

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
				value={[editModeFromViewOptions(viewOptions)]}
				onValueChange={handleEditModeChange}
			>
				{editModeOptions.map(({ value, label, icon: Icon }) => (
					<ToggleGroupItem
						key={value}
						value={value}
						aria-label={label}
						title={label}
					>
						<Icon />
					</ToggleGroupItem>
				))}
			</ToggleGroup>

			<ToggleGroup
				multiple
				value={toToggleValues(viewOptions)}
				onValueChange={(values) => setViewOptions(fromToggleValues(values))}
			>
				{VIEW_TOGGLES.map(({ value, key, label, on: On, off: Off }) => (
					<ToggleGroupItem
						key={value}
						value={value}
						aria-label={label}
						title={label}
					>
						{viewOptions[key] ? <On /> : <Off />}
					</ToggleGroupItem>
				))}
			</ToggleGroup>

			<ThemeToggle />

			<div className="ml-auto">
				<ButtonCopy content={content} />
			</div>
		</div>
	)
}

export default Toolbar
