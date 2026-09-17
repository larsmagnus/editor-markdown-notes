import * as vscode from 'vscode'

import { addDictionaryWords } from '#src/host/dictionary-words-command'
import { openActiveTabInTextEditor } from '#src/host/open-active-tab-in-text-editor'
import { openFile } from '#src/host/open-file-command'
import { openPdfAsNotes } from '#src/host/open-pdf-command'
import type { SettingsStore } from '#src/host/settings-store'
import { pickSpellingLanguage } from '#src/host/spelling-picker'
import { pickTheme } from '#src/host/theme-picker'
import { toggleHideToolbar } from '#src/host/toggle-hide-toolbar-command'
import { EXTENSION_ID } from '#src/shared/constants'
import type { ViewOptions } from '#src/shared/messages'

/** The view options a command can flip, keyed by the command that flips them. */
const VIEW_OPTION_TOGGLES = {
	[`${EXTENSION_ID}.toggleRaw`]: 'raw',
	[`${EXTENSION_ID}.toggleFullWidth`]: 'fullWidth',
	[`${EXTENSION_ID}.toggleTextTools`]: 'textTools',
} as const satisfies Record<string, keyof ViewOptions>

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
	const simpleCommands: Record<string, (uri?: vscode.Uri) => unknown> = {
		[`${EXTENSION_ID}.openFile`]: openFile,
		[`${EXTENSION_ID}.openMarkdownEditor`]: openFile,
		[`${EXTENSION_ID}.openPdfAsNotes`]: (uri) => openPdfAsNotes(uri, log),
		[`${EXTENSION_ID}.selectTheme`]: () => pickTheme(store, broadcastConfig),
		[`${EXTENSION_ID}.selectSpellingLanguage`]: () =>
			pickSpellingLanguage(store, broadcastConfig),
		[`${EXTENSION_ID}.addDictionaryWords`]: () =>
			addDictionaryWords(store, broadcastConfig),
		[`${EXTENSION_ID}.openInTextEditor`]: openActiveTabInTextEditor,
		[`${EXTENSION_ID}.toggleHideToolbar`]: toggleHideToolbar,
		[`${EXTENSION_ID}.showLogs`]: () => log.show(),
		[`${EXTENSION_ID}.claimFormattingShortcut`]: () => {
			// Prevents VS Code's default formatting keybindings from firing when
			// text is selected in the custom editor.
		},
	}
	const simple = Object.entries(simpleCommands).map(([command, handler]) =>
		vscode.commands.registerCommand(command, handler)
	)

	return vscode.Disposable.from(...toggles, ...simple)
}
