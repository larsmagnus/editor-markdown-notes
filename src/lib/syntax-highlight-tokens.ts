import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { HighlighterCore } from 'shiki'

import { parseFence } from '#src/editor/extensions/code-block/code-fence'
import { parseFrontmatterFence } from '#src/editor/extensions/frontmatter/frontmatter-fence'
import { MERMAID_LANGUAGE } from '#src/editor/extensions/mermaid/language'
import type { PlacedToken } from '#src/editor/extensions/syntax-highlight/syntax-highlight-extension'
import { ensureLanguage } from '#src/lib/shiki-highlighter'

/** One fenced code block's current text, language and document position. */
export type CodeBlockSnapshot = { text: string; language: string; from: number }

/** A Shiki token's color/style, positioned relative to its own block's text. */
export type RelativeToken = {
	offset: number
	length: number
	color: string
	fontStyle?: number
}

/**
 * Every highlightable block in the doc: tagged, non-mermaid fenced code
 * blocks, plus the frontmatter block (always `yaml` - it has no language
 * attribute of its own to read).
 */
export function collectCodeBlocks(doc: ProseMirrorNode): CodeBlockSnapshot[] {
	const blocks: CodeBlockSnapshot[] = []

	doc.descendants((node, pos) => {
		if (node.type.name === 'frontmatter') {
			const { codeFrom, codeTo } = parseFrontmatterFence(node.textContent)
			blocks.push({
				text: node.textContent.slice(codeFrom, codeTo),
				language: 'yaml',
				from: pos + 1 + codeFrom,
			})
			return
		}

		if (node.type.name !== 'codeBlock') return
		const { language, codeFrom, codeTo } = parseFence(node.textContent)
		if (!language || language === MERMAID_LANGUAGE) return
		blocks.push({
			text: node.textContent.slice(codeFrom, codeTo),
			language,
			// +1 for the node's own opening token, +codeFrom past the fence line.
			from: pos + 1 + codeFrom,
		})
	})

	return blocks
}

/** Tokenizes one block's text with Shiki, or `[]` for an unknown language. */
export async function tokenizeBlock(
	highlighter: HighlighterCore,
	block: CodeBlockSnapshot,
	themeId: string
): Promise<RelativeToken[]> {
	const lang = await ensureLanguage(highlighter, block.language)
	if (!lang) return []

	return highlighter
		.codeToTokensBase(block.text, { lang, theme: themeId })
		.flat()
		.filter((token) => token.color)
		.map((token) => ({
			offset: token.offset,
			length: token.content.length,
			color: token.color as string,
			fontStyle: token.fontStyle,
		}))
}

/** Resolves a block's relative tokens to document positions. */
export function placeTokens(
	block: CodeBlockSnapshot,
	tokens: RelativeToken[]
): PlacedToken[] {
	return tokens.map((token) => ({
		from: block.from + token.offset,
		to: block.from + token.offset + token.length,
		color: token.color,
		fontStyle: token.fontStyle,
	}))
}
