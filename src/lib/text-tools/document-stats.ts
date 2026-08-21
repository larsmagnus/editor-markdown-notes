import type { Node as ProseMirrorNode } from 'prosemirror-model'

export type TextStats = {
	words: number
	characters: number
	charactersNoSpaces: number
	readingTimeMinutes: number
}

const WORDS_PER_MINUTE = 200

/**
 * Word, character and reading-time counts for the document.
 *
 * Takes two variants of the same text: `text` has a separator between blocks
 * so words either side of a paragraph break don't glue into one when split on
 * whitespace, while `rawText` has none, since that separator was never
 * actually typed and would otherwise inflate the character counts.
 */
export function computeTextStats(text: string, rawText: string): TextStats {
	const trimmed = text.trim()
	const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length

	return {
		words,
		characters: rawText.length,
		charactersNoSpaces: rawText.replace(/\s/g, '').length,
		readingTimeMinutes: words === 0 ? 0 : Math.ceil(words / WORDS_PER_MINUTE),
	}
}

/** Number of `paragraph` nodes in the document, excluding headings, list items and other textblocks. */
export function countParagraphs(doc: ProseMirrorNode): number {
	let count = 0

	doc.descendants((node) => {
		if (node.type.name === 'paragraph') count += 1
	})

	return count
}
