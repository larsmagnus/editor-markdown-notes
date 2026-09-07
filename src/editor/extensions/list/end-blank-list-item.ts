import type { Editor } from '@tiptap/core'

import { resolveMarkerCaret } from '@/editor/extensions/block-marker/marker-caret'
import type { MarkerCaret } from '@/editor/extensions/block-marker/marker-caret'
import { listMarkerSpec } from '@/editor/extensions/block-marker/specs'
import { outdentListItem } from '@/editor/extensions/list/outdent-list-item'

/**
 * The list item the caret is in when the item's entire content is its own
 * marker - what an empty item looks like now that its `- `/`N. `/`- [ ] ` is
 * real text (see `list-marker.ts`). No item here is ever empty by content, so
 * nothing downstream recognises one without asking this.
 *
 * An item carrying anything past its marker line - a nested list, a second
 * paragraph - is not blank however that line reads, mirroring `splitListItem`'s
 * own "the marker paragraph is the item's last child" condition so those items
 * keep the stock split.
 *
 * Measured on the marker line's `content.size`, never its text: an image is an
 * inline atom contributing no text at all, so an item holding one reads as
 * marker-only by text and would be lifted out of its own list on the next
 * Enter. Same trap the table serializer already has to avoid.
 *
 * Every position on that line counts, offset 0 included. Gating on the marker
 * boundary the way Backspace and Tab do would hand `Home` then Enter back to
 * `splitListItem`, which answers a blank item with two more of them - the loop
 * this exists to break.
 */
function blankListItemAtCaret(editor: Editor): MarkerCaret | null {
	const caret = resolveMarkerCaret(editor)
	if (caret?.spec !== listMarkerSpec) return null
	if (caret.match.host.node.content.size !== caret.markerLength) return null
	if (caret.match.node.childCount !== 1) return null
	return caret
}

/**
 * Ends the list item the caret sits in when that item holds nothing but its
 * marker, which is what Enter means there: one level out, the same as
 * Shift-Tab. Declines anywhere else, leaving an item with real content to the
 * stock split.
 *
 * Swallowed either way once it applies: a declined outdent falling through to
 * `splitListItem` is the blank-item loop this exists to break.
 */
export function endBlankListItem(editor: Editor): boolean {
	const caret = blankListItemAtCaret(editor)
	if (!caret) return false

	outdentListItem(editor, caret)
	return true
}
