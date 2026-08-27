/**
 * A blockquote's literal leading marker on its own first line - `"> "` -
 * the only source of truth for whether it's present, now that it lives as
 * real text inside the quote's own first paragraph (see
 * `create-marker-sync-plugin.ts`). Just one fixed form, unlike a list
 * item's marker (`list-marker.ts`) - a blockquote has no ordered/task/bullet
 * variants to distinguish, so there is nothing to parse beyond "is it there".
 */
export const BLOCKQUOTE_MARKER = '> '

/** Length of the marker at the very start of `text`, or `0` if absent. */
export function blockquoteMarkerLength(text: string): number {
	return text.startsWith(BLOCKQUOTE_MARKER) ? BLOCKQUOTE_MARKER.length : 0
}
