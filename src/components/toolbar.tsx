import { ButtonCopyPage } from '#src/components/button-copy-page'
import type { DevFileSelectorProps } from '#src/components/dev-file-selector'
import { editModeFromViewOptions } from '#src/components/edit-mode-options'
import { OptionalDevFileSelector } from '#src/components/optional-dev-file-selector'
import ThemeToggle from '#src/components/theme-toggle'
import { ToggleGroup, ToggleGroupItem } from '#src/components/ui/toggle-group'
import { ViewToggleIcon } from '#src/components/view-toggle-icon'
import {
	fromToggleValues,
	toToggleValues,
	VIEW_TOGGLES,
} from '#src/components/view-toggle-options'
import { useSettings } from '#src/hooks/use-settings'
import { useToolbarEditMode } from '#src/hooks/use-toolbar-edit-mode'

type ToolbarProps = {
	files: DevFileSelectorProps['values']
	fileName: string
	setFileName: DevFileSelectorProps['setValue']
	content: string
}

function Toolbar({ files, fileName, setFileName, content }: ToolbarProps) {
	const { viewOptions, setViewOptions, isVSCodeContext } = useSettings()
	const { editModeOptions, handleEditModeChange } = useToolbarEditMode()

	return (
		<div
			role="toolbar"
			className="sticky top-0 left-0 bg-background/20 backdrop-blur-md p-3 flex gap-2 items-center z-20 scroll-fade overflow-x-auto"
		>
			<OptionalDevFileSelector
				show={!isVSCodeContext}
				files={files}
				fileName={fileName}
				setFileName={setFileName}
			/>

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
				{VIEW_TOGGLES.map(({ value, key, label, on, off }) => (
					<ToggleGroupItem
						key={value}
						value={value}
						aria-label={label}
						title={label}
					>
						<ViewToggleIcon on={viewOptions[key]} OnIcon={on} OffIcon={off} />
					</ToggleGroupItem>
				))}
			</ToggleGroup>

			<ThemeToggle />

			<div className="ml-auto">
				<ButtonCopyPage content={content} />
			</div>
		</div>
	)
}

export default Toolbar
