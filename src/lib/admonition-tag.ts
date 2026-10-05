/**
 * The five alert kinds GFM defines, in the order the slash menu lists them.
 * Dependency-free so the MCP server's prose walk can share it with the editor.
 */
export const ADMONITION_TYPES = [
	'note',
	'tip',
	'important',
	'warning',
	'caution',
] as const

export type AdmonitionType = (typeof ADMONITION_TYPES)[number]

/** `[!TYPE]` with the type name captured, case-insensitive as GitHub reads it. */
export const ADMONITION_TAG_PATTERN = new RegExp(
	`^\\[!(${ADMONITION_TYPES.join('|')})\\]$`,
	'i'
)

/** The type named by `name`, in any case, or `null` when it is not one. */
export function parseAdmonitionType(name: string): AdmonitionType | null {
	return ADMONITION_TYPES.find((type) => type === name.toLowerCase()) ?? null
}

/** The `[!TYPE]` text `type` is written as in markdown. */
export function admonitionTagText(type: AdmonitionType): string {
	return `[!${type.toUpperCase()}]`
}
