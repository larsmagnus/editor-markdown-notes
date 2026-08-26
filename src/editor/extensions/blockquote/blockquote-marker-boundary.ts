import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import { blockquoteMarkerLength } from '@/editor/extensions/blockquote/blockquote-marker'

type BlockquoteCaret = { markerLength: number; parentOffset: number }

/**
 * The caret's position relative to its enclosing blockquote's own marker, or
 * `null` if the caret isn't inside a blockquote's own first paragraph at
 * all. Shared groundwork for `isAtBlockquoteMarkerBoundary` and
 * `isAtBlockquoteFirstContentChar` below - both need the same "is this a
 * blockquote, how long is its marker, where's the caret in it" answer, just
 * compared against a different offset. Mirrors `list-item-at-marker-
 * boundary.ts`'s `resolveListMarkerCaret`.
 */
function resolveBlockquoteCaret(editor: Editor): BlockquoteCaret | null {
	const { selection } = editor.state
	if (!(selection instanceof TextSelection) || !selection.empty) return null

	const { $from } = selection
	if ($from.depth < 1) return null

	const quoteDepth = $from.depth - 1
	const quote = $from.node(quoteDepth)
	if (quote.type.name !== 'blockquote') return null
	if ($from.index(quoteDepth) !== 0) return null

	const markerLength = blockquoteMarkerLength($from.parent.textContent)
	if (markerLength === 0) return null

	return { markerLength, parentOffset: $from.parentOffset }
}

/**
 * The caret sits right after the blockquote's own marker - the same "right
 * after the bullet/number/checkbox" position `list-item-at-marker-
 * boundary.ts`'s `listItemAtMarkerBoundary` detects for list items.
 */
export function isAtBlockquoteMarkerBoundary(editor: Editor): boolean {
	const caret = resolveBlockquoteCaret(editor)
	return caret !== null && caret.parentOffset === caret.markerLength
}

/**
 * The caret is one position past the marker - about to backspace the
 * quote's very first content character, immediately after the marker's own
 * (CSS-hidden) span. See `list-item-at-marker-boundary.ts`'s
 * `listItemAtFirstContentChar` for why this needs its own explicit deletion
 * rather than falling through to the browser's native one: right at that
 * exact boundary, native contenteditable deletion can reach across the
 * hidden span and take part of the marker with it.
 */
export function isAtBlockquoteFirstContentChar(editor: Editor): boolean {
	const caret = resolveBlockquoteCaret(editor)
	return caret !== null && caret.parentOffset === caret.markerLength + 1
}
