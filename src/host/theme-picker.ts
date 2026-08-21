import type { Theme } from '../shared/messages'

import type { SettingsStore } from './settings-store'
import type { ViewOptionChoice } from './view-option-picker'
import { pickViewOption } from './view-option-picker'

const THEME_CHOICES: ViewOptionChoice<Theme>[] = [
	{ label: 'Light', value: 'light' },
	{ label: 'Dark', value: 'dark' },
	{ label: 'System', value: 'system' },
]

/** Mirrors the toolbar's theme toggle, so it stays reachable when it is hidden. */
export function pickTheme(
	store: SettingsStore,
	onPicked: () => void
): Promise<void> {
	return pickViewOption(
		store,
		{
			key: 'theme',
			title: 'Editor Markdown Notes: theme',
			placeHolder: 'Select a theme',
			choices: THEME_CHOICES,
		},
		onPicked
	)
}
