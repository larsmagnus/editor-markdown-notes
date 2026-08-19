import * as vscode from 'vscode'

import type { ViewOptions } from '../shared/messages'

import type { SettingsStore } from './settings-store'

/** One offered value, and what the quick pick calls it. */
export type ViewOptionChoice<Value> = { label: string; value: Value }

type PickViewOptionOptions<Key extends keyof ViewOptions> = {
	key: Key
	title: string
	placeHolder: string
	choices: ViewOptionChoice<ViewOptions[Key]>[]
}

/**
 * Sets one enum-valued view option from a quick pick.
 *
 * Shared by the theme and spelling-language commands, which differ only in their
 * wording and their list of values. Both exist so that a choice the panel or
 * the toolbar offers stays reachable when either is hidden.
 */
export async function pickViewOption<Key extends keyof ViewOptions>(
	store: SettingsStore,
	{ key, title, placeHolder, choices }: PickViewOptionOptions<Key>,
	onPicked: () => void
): Promise<void> {
	const current = store.getViewOptions()[key]
	const items: vscode.QuickPickItem[] = choices.map(({ label, value }) => ({
		label,
		description: value === current ? 'current' : undefined,
	}))

	const picked = await vscode.window.showQuickPick(items, {
		title,
		placeHolder,
	})
	if (!picked) return

	const choice = choices.find(({ label }) => label === picked.label)
	if (!choice) return

	await store.updateViewOptions({ [key]: choice.value })
	onPicked()
}
