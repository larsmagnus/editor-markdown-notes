import { detectMdxSpans } from '#src/editor/extensions/mdx-block/detect-mdx-spans'

/**
 * Bracket characters unlikely to occur in real prose or JSX, so a placeholder
 * built from them survives markdown-it's parse as inert paragraph text and is
 * never mistaken for something the author wrote.
 */
const OPEN = '⟦'
const CLOSE = '⟧'

function placeholderFor(index: number): string {
	return `${OPEN}MDX_BLOCK_${index}${CLOSE}`
}

/**
 * Reads a paragraph's text back into the block index it stands in for, or
 * `null` if it isn't one of ours.
 */
export function mdxPlaceholderIndex(text: string): number | null {
	const match = /^⟦MDX_BLOCK_(\d+)⟧$/.exec(text)
	if (!match) return null

	return Number(match[1])
}

export type SplicedMdxBody = {
	/** Safe to hand to markdown-it: every detected span is now a placeholder line. */
	text: string
	/** The original raw text each placeholder stands in for, indexed to match. */
	blocks: string[]
}

/**
 * Replaces every top-level MDX construct in `body` with a single-line
 * placeholder markdown-it parses as an ordinary paragraph, keeping the
 * original raw text on the side to restore verbatim once parsing is done -
 * see `restoreMdxBlocksInTransaction`.
 */
export function spliceMdxPlaceholders(body: string): SplicedMdxBody {
	const spans = detectMdxSpans(body)
	if (spans.length === 0) return { text: body, blocks: [] }

	let text = ''
	let cursor = 0
	const blocks: string[] = []

	spans.forEach((span, index) => {
		text += body.slice(cursor, span.start)
		text += placeholderFor(index)
		blocks.push(span.raw)
		cursor = span.end
	})
	text += body.slice(cursor)

	return { text, blocks }
}
