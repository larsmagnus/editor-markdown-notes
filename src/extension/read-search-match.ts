import * as vscode from 'vscode'

import type { Logger } from '../shared/logger'

import { parseFocusedMatch, parseSearchResults } from './search-match'
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

/**
 * The search-result match the user just clicked, if that is why we were opened.
 *
 * `search.action.copyMatch` is the only readable handle on the search view's
 * focused result, and it answers through the clipboard - so this saves and
 * restores the user's clipboard around the call. That side effect is the whole
 * reason this is quarantined in its own module.
 *
 * Returns `undefined` whenever the answer is not a match in `uri`, which covers
 * every ordinary open: no search has run, the focused result belongs to another
 * file, or the search view was never involved at all.
 */
export function readFocusedSearchMatch(
	uri: vscode.Uri,
	log: Logger
): Promise<SearchMatch | undefined> {
	// Single-flight, because two overlapping calls destroy what they are meant
	// to protect: the second reads the blank the first wrote as the clipboard's
	// "previous" contents, and whichever finishes last restores that blank.
	inFlight ??= readFocusedSearchMatchOnce(uri, log).finally(() => {
		inFlight = undefined
	})

	return inFlight
}

let inFlight: Promise<SearchMatch | undefined> | undefined

async function readFocusedSearchMatchOnce(
	uri: vscode.Uri,
	log: Logger
): Promise<SearchMatch | undefined> {
	let previousClipboard: string

	try {
		// Inside the guard: on a headless or remote host the clipboard is
		// unavailable, and this must degrade to "no match" like every other
		// failure here rather than reject into a caller that discards it.
		previousClipboard = await vscode.env.clipboard.readText()
	} catch (error) {
		log.warn(`Could not read the clipboard: ${String(error)}`)

		return undefined
	}

	try {
		await vscode.env.clipboard.writeText('')
		await vscode.commands.executeCommand('search.action.copyMatch')

		const copied = await vscode.env.clipboard.readText()
		const focused = parseFocusedMatch(copied)
		if (!focused) return undefined

		return (await belongsTo(uri, focused)) ? focused : undefined
	} catch (error) {
		log.warn(`Could not read the focused search match: ${String(error)}`)

		return undefined
	} finally {
		await vscode.env.clipboard.writeText(previousClipboard)
	}
}

/**
 * Whether the focused match sits in this file.
 *
 * `copyMatch` names no file, so the full result set is what ties a match back
 * to a path. Comparing on line and column rather than on text keeps this honest
 * when the same line appears in several files.
 */
async function belongsTo(
	uri: vscode.Uri,
	focused: SearchMatch
): Promise<boolean> {
	const matches = (await readSearchResults()).get(uri.fsPath)

	return (
		matches?.some(
			(match) => match.line === focused.line && match.column === focused.column
		) ?? false
	)
}
