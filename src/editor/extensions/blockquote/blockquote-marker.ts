/**
 * A blockquote's literal leading marker on its own first line - `"> "` -
 * the only source of truth for whether it's present, now that it lives as
 * real text inside the quote's own first paragraph (see
 * `blockquote-marker-sync-plugin.ts`). Just one fixed form, unlike a list
 * item's marker (`list-marker.ts`) - a blockquote has no ordered/task/bullet
 * variants to distinguish, so there is nothing to parse beyond "is it there".
 */
export const BLOCKQUOTE_MARKER = '> '

/** Length of the marker at the very start of `text`, or `0` if absent. */
export function blockquoteMarkerLength(text: string): number {
	return text.startsWith(BLOCKQUOTE_MARKER) ? BLOCKQUOTE_MARKER.length : 0
}

/**
 * A blockquote's own first paragraph's *content* starts two positions past
 * the blockquote's own opening - past the blockquote's own opening (`+1`)
 * and its first child, the paragraph, opening (`+1` again). Mirrors
 * `list-marker.ts`'s `firstParagraphStart`, one level shallower since a
 * blockquote wraps a paragraph directly (no intermediate item node).
 */
export function firstParagraphStart(blockquotePos: number): number {
	return blockquotePos + 2
}

/**
 * The position of the paragraph *node itself* (one level shallower than
 * `firstParagraphStart`) - the position `replaceWith` needs to replace the
 * whole node, as opposed to inserting into its content.
 */
export function firstParagraphNodeStart(blockquotePos: number): number {
	return blockquotePos + 1
}
