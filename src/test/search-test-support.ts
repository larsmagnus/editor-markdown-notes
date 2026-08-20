import * as vscode from 'vscode'

import { readFocusedSearchMatch } from '../extension/read-search-match'
import type { Logger } from '../shared/logger'

/** Shared fixtures and helpers for the search-reveal integration suites. */

export const VIEW_TYPE = 'editor-markdown-notes.markdownEditor'

/** Mirrors the fixture the bug was reported against: two matches on one line. */
export const NOTE = `# Probe fixture

Filler paragraph one.

\`\`\`html
<form action="/submit" method="post">
	<label for="email">Email</label>
	<input id="email" name="email" type="email" required /><input id="second" />
</form>
\`\`\`

Trailing paragraph.
`

export function pause(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Runs a workspace search and leaves focus on the result list. */
export async function runSearch(query: string) {
	await vscode.commands.executeCommand('workbench.action.findInFiles', {
		query,
		triggerSearch: true,
		isRegex: false,
	})
	// ripgrep runs in the renderer; nothing signals completion to an extension.
	await pause(3000)

	await vscode.commands.executeCommand('search.action.focusSearchList')
	await pause(500)
}

/**
 * Activates every search result belonging to `file`, reporting the column of
 * each once its editor has opened.
 *
 * The second activation onwards lands on a tab that is already open, which is
 * the case `resolveCustomTextEditor` never sees.
 */
export async function activateMatchesIn(
	file: vscode.Uri,
	log: Logger
): Promise<(number | undefined)[]> {
	const columns: (number | undefined)[] = []

	for (let step = 0; step < 12; step++) {
		await vscode.commands.executeCommand('search.action.focusNextSearchResult')
		await pause(300)

		if (!(await readFocusedSearchMatch(file, log))) continue

		await vscode.commands.executeCommand('search.action.openResult')
		await pause(1000)

		const opened = await readFocusedSearchMatch(file, log)
		console.log(`  activated: ${JSON.stringify(opened)}`)
		columns.push(opened?.column)

		await vscode.commands.executeCommand('search.action.focusSearchList')
		await pause(300)
	}

	return columns
}

export function setEditorAssociations(
	value: Record<string, string> | undefined
) {
	return vscode.workspace
		.getConfiguration('workbench')
		.update('editorAssociations', value, vscode.ConfigurationTarget.Global)
}
