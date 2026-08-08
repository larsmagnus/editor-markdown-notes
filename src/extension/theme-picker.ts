import * as vscode from 'vscode'

import type { Theme } from '../shared/messages'

import type { SettingsStore } from './settings-store'

const THEME_CHOICES: { label: string; value: Theme }[] = [
	{ label: 'Light', value: 'light' },
	{ label: 'Dark', value: 'dark' },
	{ label: 'System', value: 'system' },
]

/** Mirrors the toolbar's theme toggle, so it stays reachable when it is hidden. */
export async function pickTheme(
	store: SettingsStore,
	onPicked: () => void
): Promise<void> {
	const current = store.getViewOptions().theme
	const items: vscode.QuickPickItem[] = THEME_CHOICES.map(
		({ label, value }) => ({
			label,
			description: value === current ? 'current' : undefined,
		})
	)

	const picked = await vscode.window.showQuickPick(items, {
		title: 'Editor Markdown Notes: theme',
		placeHolder: 'Select a theme',
	})
	if (!picked) return

	const choice = THEME_CHOICES.find(({ label }) => label === picked.label)
	if (!choice) return

	await store.updateViewOptions({ theme: choice.value })
	onPicked()
}
