const SLASH_QUERY = /^\/(\S*)$/

export type SlashQuery = {
	/** Offset of the `/` that opened the menu. */
	from: number
	query: string
}

/**
 * The `/query` the caret sits at the end of, only when the `/` starts its line -
 * the same rule as the live editor's menu, since every command is a block.
 */
export function findSlashQuery(text: string, caret: number): SlashQuery | null {
	const lineStart = text.lastIndexOf('\n', caret - 1) + 1
	const match = SLASH_QUERY.exec(text.slice(lineStart, caret))
	return match ? { from: lineStart, query: match[1] ?? '' } : null
}
