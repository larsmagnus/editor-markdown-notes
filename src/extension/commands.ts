import * as vscode from 'vscode'

import { EXTENSION_ID } from '../shared/constants'
import type { ViewOptions } from '../shared/messages'

import { addDictionaryWords } from './dictionary-words-command'
import { openFile } from './open-file-command'
import { openInTextEditor } from './open-in-text-editor-command'
import type { SettingsStore } from './settings-store'
import { pickSpellingLanguage } from './spelling-picker'
import { pickTheme } from './theme-picker'
import { toggleHideToolbar } from './toggle-hide-toolbar-command'

/** The view options a command can flip, keyed by the command that flips them. */
const VIEW_OPTION_TOGGLES = {
	[`${EXTENSION_ID}.toggleRaw`]: 'raw',
	[`${EXTENSION_ID}.toggleFullWidth`]: 'fullWidth',
	[`${EXTENSION_ID}.toggleTextTools`]: 'textTools',
} as const satisfies Record<string, keyof ViewOptions>

/**
 * Resolves the active tab's document, needed because `activeTextEditor` is
 * unset while a custom editor (not a text editor) has focus.
 */
function openActiveTabInTextEditor() {
	const tab = vscode.window.tabGroups.activeTabGroup.activeTab
	const uri =
		tab?.input instanceof vscode.TabInputCustom ? tab.input.uri : undefined

	if (!uri) return

	return openInTextEditor(uri)
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

	// Two ids share `openFile`: it reads well in the command palette
	// ("Editor Markdown Notes: Open file"), `openMarkdownEditor` reads well in
	// the context menus, where the category is not shown.
	const simpleCommands: Record<string, () => unknown> = {
		[`${EXTENSION_ID}.openFile`]: openFile,
		[`${EXTENSION_ID}.openMarkdownEditor`]: openFile,
		[`${EXTENSION_ID}.selectTheme`]: () => pickTheme(store, broadcastConfig),
		[`${EXTENSION_ID}.selectSpellingLanguage`]: () =>
			pickSpellingLanguage(store, broadcastConfig),
		[`${EXTENSION_ID}.addDictionaryWords`]: () =>
			addDictionaryWords(store, broadcastConfig),
		[`${EXTENSION_ID}.openInTextEditor`]: openActiveTabInTextEditor,
		[`${EXTENSION_ID}.toggleHideToolbar`]: toggleHideToolbar,
		[`${EXTENSION_ID}.showLogs`]: () => log.show(),
	}
	const simple = Object.entries(simpleCommands).map(([command, handler]) =>
		vscode.commands.registerCommand(command, handler)
	)

	return vscode.Disposable.from(...toggles, ...simple)
}
