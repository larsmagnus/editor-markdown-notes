import { createContext, useContext } from 'react'

import { DEFAULT_SETTINGS, DEFAULT_VIEW_OPTIONS } from '@/shared/messages'
import type { ExtensionSettings, ViewOptions } from '@/shared/messages'

export type SettingsState = {
	/** User-toggleable view state, persisted and shared across editor tabs. */
	viewOptions: ViewOptions
	setViewOptions: (patch: Partial<ViewOptions>) => void
	/** Read-only in the webview — configured through VS Code Settings. */
	settings: ExtensionSettings
	isVSCodeContext: boolean
}

export const SettingsContext = createContext<SettingsState>({
	viewOptions: DEFAULT_VIEW_OPTIONS,
	setViewOptions: () => {},
	settings: DEFAULT_SETTINGS,
	isVSCodeContext: false,
})

export const useSettings = () => useContext(SettingsContext)
