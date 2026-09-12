import { getMarkdownSourceText } from '#src/lib/text-tools/markdown-source-text'
import type { SourcePosition } from '#src/mcp/source-position'
import { positionMapper } from '#src/mcp/source-position'

/**
 * The MCP server's own view of a note's prose: the same flattened text the
 * raw editor's highlights are placed against (`markdown-source-text.ts`), with
 * a line/column mapper layered on top - what an agent acts on, rather than a
 * character offset with no meaning outside this module.
 */
export type MarkdownProse = {
	text: string
	positionAt: (offset: number) => SourcePosition
}

export function markdownProse(markdown: string): MarkdownProse {
	const { text, slices } = getMarkdownSourceText(markdown)
	return { text, positionAt: positionMapper(markdown, slices) }
}
