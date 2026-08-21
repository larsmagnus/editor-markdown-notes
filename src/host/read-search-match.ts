import * as vscode from 'vscode'

import { parseSearchResults } from './search-match'
import type { SearchMatch } from './search-match'

/**
 * Every current search match, keyed by file, newest search only.
 *
 * The whole set rather than one file's, because the query's own length is only
 * recoverable by comparing matches against each other and matches in unrelated
 * files are what sharpen that - see `deriveQueryLength`.
 */
export async function readSearchResults(): Promise<Map<string, SearchMatch[]>> {
	const results = await vscode.commands.executeCommand<string>(
		'search.action.getSearchResults'
	)
	if (typeof results !== 'string') return new Map()

	return parseSearchResults(results)
}

/**
 * Every current search match in this file, newest search only.
 *
 * Clipboard-free, which is what makes it safe on the ordinary open path: a note
 * opened with no search running simply yields nothing.
 */
export async function readSearchMatches(
	uri: vscode.Uri
): Promise<SearchMatch[]> {
	return (await readSearchResults()).get(uri.fsPath) ?? []
}
