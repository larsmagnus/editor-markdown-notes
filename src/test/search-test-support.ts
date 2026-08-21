import * as vscode from 'vscode'

/** Shared fixtures and helpers for the search-reveal integration suites. */

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
