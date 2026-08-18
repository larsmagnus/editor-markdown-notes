/**
 * Parsing for the search view's two readable commands.
 *
 * `search.action.getSearchResults` returns the whole result set as text,
 * grouped by absolute file path, one match per line as `  line,column: text`.
 * `search.action.copyMatch` returns the *focused* match alone, in the same
 * `line,column: text` shape. Both are 1-based on line and column, which is why
 * everything here converts to the 0-based positions VSCode's API uses.
 *
 * These are the only route by which a search-result click can reach a custom
 * editor: `resolveCustomTextEditor` is handed no selection, and revealing an
 * already-open tab raises no event carrying one.
 */

export interface SearchMatch {
	/** 0-based, matching `vscode.Position`. */
	readonly line: number
	/** 0-based, matching `vscode.Position`. */
	readonly column: number
	/** The whole source line the match sits on, verbatim including indentation. */
	readonly lineText: string
}

/** `  67,2: \t<input id="email" …` - leading spaces vary with nesting depth. */
const MATCH_LINE = /^\s*(\d+),(\d+):\s?(.*)$/

/**
 * The match the search view currently has focused, from `copyMatch` output.
 *
 * Returns `undefined` for anything that is not a single match line - an empty
 * clipboard, or a whole-file copy, both of which mean "no match is focused"
 * rather than an error worth surfacing.
 */
export function parseFocusedMatch(copied: string): SearchMatch | undefined {
	const [line] = copied.split('\n')
	if (!line) return undefined

	return toMatch(line)
}

/**
 * Every match, keyed by the absolute path of the file holding it.
 *
 * Path lines are unindented and match lines are indented, which is the only
 * thing separating the two in the command's output. A line that is neither -
 * a header, or a "results truncated" notice - is ignored rather than taken for
 * a path: filing matches under a notice would leave the real file's entry
 * empty, and an empty entry reads as "nothing to reveal" with nothing to show
 * for it.
 */
export function parseSearchResults(
	results: string
): Map<string, SearchMatch[]> {
	const byFile = new Map<string, SearchMatch[]>()
	let current: SearchMatch[] | undefined

	for (const line of results.split('\n')) {
		if (!line.trim()) continue

		const match = toMatch(line)
		if (match) {
			current?.push(match)
			continue
		}

		// Absolute paths only, matching what the command emits.
		if (!line.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(line)) continue

		current = []
		byFile.set(line.trim(), current)
	}

	return byFile
}

function toMatch(line: string): SearchMatch | undefined {
	const parsed = MATCH_LINE.exec(line)
	if (!parsed) return undefined

	const [, lineNumber, column, lineText] = parsed

	return {
		line: Number(lineNumber) - 1,
		column: Number(column) - 1,
		lineText,
	}
}
