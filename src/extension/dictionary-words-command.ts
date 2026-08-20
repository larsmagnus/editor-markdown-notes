import * as vscode from 'vscode'

import type { SettingsStore } from './settings-store'

/**
 * Adds words to the spelling check's personal list.
 *
 * The write half of the MCP server's `suggest_dictionary_words`, which runs in
 * a child process with no `vscode` module and so can only report candidates.
 * Paste its suggestions here to accept them.
 *
 * Existing words are kept and duplicates dropped, so running it twice with an
 * overlapping list is harmless.
 */
export async function addDictionaryWords(
	store: SettingsStore,
	onAdded: () => void
): Promise<void> {
	const entered = await vscode.window.showInputBox({
		title: 'Editor Markdown Notes: add words to dictionary',
		prompt: 'Words the spelling check should accept, separated by commas',
		placeHolder: 'nspell, retext, frontmatter',
	})

	if (entered === undefined) return

	const added = entered
		.split(',')
		.map((word) => word.trim())
		.filter(Boolean)

	if (added.length === 0) return

	const existing = store.getViewOptions().spellingIgnoreWords
	const merged = [...new Set([...existing, ...added])]

	await store.updateViewOptions({ spellingIgnoreWords: merged })
	onAdded()

	vscode.window.showInformationMessage(
		`Added ${merged.length - existing.length} word(s) to the dictionary.`
	)
}
