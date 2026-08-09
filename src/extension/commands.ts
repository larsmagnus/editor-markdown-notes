import * as vscode from 'vscode'

import { DEFAULT_SETTINGS } from '../shared/messages'
import type { ViewOptions } from '../shared/messages'

import { CONFIG_SECTION } from './constants'
import { openFile } from './open-file-command'
import type { SettingsStore } from './settings-store'
import { pickTheme } from './theme-picker'

/** The view options a command can flip, keyed by the command that flips them. */
const VIEW_OPTION_TOGGLES = {
	'editor-markdown-notes.toggleRaw': 'raw',
	'editor-markdown-notes.toggleFullWidth': 'fullWidth',
	'editor-markdown-notes.toggleTextTools': 'textTools',
} as const satisfies Record<string, keyof ViewOptions>

/**
 * `hideToolbar` is a workspace/user setting rather than a persisted view option,
 * so it is flipped through the configuration API. The provider picks the change
 * up through `onDidChangeConfiguration` and rebroadcasts on its own.
 */
async function toggleHideToolbar() {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

	await config.update(
		'hideToolbar',
		!config.get<boolean>('hideToolbar', DEFAULT_SETTINGS.hideToolbar),
		vscode.ConfigurationTarget.Global
	)
}

export function registerCommands(
	store: SettingsStore,
	log: vscode.LogOutputChannel,
	broadcastConfig: () => void
): vscode.Disposable {
	const toggles = Object.entries(VIEW_OPTION_TOGGLES).map(([command, key]) =>
		vscode.commands.registerCommand(command, async () => {
			await store.updateViewOptions({ [key]: !store.getViewOptions()[key] })
			broadcastConfig()
		})
	)

	return vscode.Disposable.from(
		...toggles,
		// Two ids share one handler: `openFile` reads well in the command palette
		// ("Editor Markdown Notes: Open file"), `openMarkdownEditor` reads well in
		// the context menus, where the category is not shown.
		vscode.commands.registerCommand('editor-markdown-notes.openFile', openFile),
		vscode.commands.registerCommand(
			'editor-markdown-notes.openMarkdownEditor',
			openFile
		),
		vscode.commands.registerCommand('editor-markdown-notes.selectTheme', () =>
			pickTheme(store, broadcastConfig)
		),
		vscode.commands.registerCommand(
			'editor-markdown-notes.toggleHideToolbar',
			toggleHideToolbar
		),
		vscode.commands.registerCommand('editor-markdown-notes.showLogs', () =>
			log.show()
		)
	)
}
