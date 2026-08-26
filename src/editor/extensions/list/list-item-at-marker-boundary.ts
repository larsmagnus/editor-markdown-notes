import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import { parseListMarker } from '@/editor/extensions/list/list-marker'

const NESTABLE_LIST_ITEM_TYPES = ['listItem', 'taskItem']

type ListMarkerCaret = {
	itemType: string
	markerLength: number
	parentOffset: number
}

/**
 * The caret's position relative to its enclosing list item's own marker, or
 * `null` if the caret isn't inside a `listItem`/`taskItem`'s own first line
 * at all. Shared groundwork for `listItemAtMarkerBoundary` (below) and
 * `listItemAtFirstContentChar` (`list-marker-backspace-extension.ts`) - both
 * need the same "which item, how long is its marker, where's the caret in
 * it" answer, just compared against a different offset.
 */
function resolveListMarkerCaret(editor: Editor): ListMarkerCaret | null {
	const { selection } = editor.state
	if (!(selection instanceof TextSelection) || !selection.empty) return null

	const { $from } = selection
	if ($from.depth < 1) return null

	const itemDepth = $from.depth - 1
	const listItem = $from.node(itemDepth)

	if (!NESTABLE_LIST_ITEM_TYPES.includes(listItem.type.name)) return null
	if ($from.index(itemDepth) !== 0) return null

	const markerLength =
		parseListMarker($from.parent.textContent)?.markerLength ?? 0
	if (markerLength === 0) return null

	return {
		itemType: listItem.type.name,
		markerLength,
		parentOffset: $from.parentOffset,
	}
}

/**
 * The list item's type name, or `null` if the caret isn't right after its
 * bullet/number/checkbox. The marker is real leading text in the item's
 * first paragraph (see `list-marker.ts`), so "right after it" is
 * `parentOffset === markerLength`, not offset 0 - offset 0 sits *before*
 * the marker, where typing would edit the marker itself rather than act on
 * the item as a whole. Shared by `tab-indent-extension.ts` (nest/un-nest)
 * and `list-marker-backspace-extension.ts` (exit the list).
 */
export function listItemAtMarkerBoundary(editor: Editor): string | null {
	const caret = resolveListMarkerCaret(editor)
	if (!caret || caret.parentOffset !== caret.markerLength) return null
	return caret.itemType
}

/**
 * The caret is one position past the marker - about to backspace the item's
 * very first content character, the character immediately following the
 * marker's own (CSS-hidden) span - or `null` otherwise.
 * `list-marker-backspace-extension.ts` uses this to delete that character
 * itself rather than letting the browser's native contenteditable deletion
 * run: right at that exact boundary, deleting natively sometimes reaches
 * across the hidden marker span and removes part of the marker along with
 * it (observed as the marker's trailing space vanishing), which
 * `list-marker-sync-plugin.ts`'s repair step then misreads as an absent
 * marker and pastes a *second* one in front of the first instead of
 * replacing it.
 */
export function listItemAtFirstContentChar(editor: Editor): boolean {
	const caret = resolveListMarkerCaret(editor)
	return caret !== null && caret.parentOffset === caret.markerLength + 1
}
