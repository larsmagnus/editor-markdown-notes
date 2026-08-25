import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import { parseListMarker } from '@/editor/extensions/list/list-marker'

const NESTABLE_LIST_ITEM_TYPES = ['listItem', 'taskItem']

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
	if (markerLength === 0 || $from.parentOffset !== markerLength) return null

	return listItem.type.name
}
