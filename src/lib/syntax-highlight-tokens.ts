import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { HighlighterCore } from 'shiki'

import { MERMAID_LANGUAGE } from '@/editor/extensions/mermaid/language'
import type { PlacedToken } from '@/editor/extensions/syntax-highlight/syntax-highlight-extension'
import { ensureLanguage } from '@/lib/shiki-highlighter'

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
			blocks.push({ text: node.textContent, language: 'yaml', from: pos + 1 })
			return
		}

		if (node.type.name !== 'codeBlock') return
		const language = String(node.attrs.language ?? '')
		if (!language || language === MERMAID_LANGUAGE) return
		blocks.push({ text: node.textContent, language, from: pos + 1 })
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
