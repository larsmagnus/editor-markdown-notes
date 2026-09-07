import type { Editor } from '@tiptap/core'

import {
	markerCaretAtBoundary,
	resolveMarkerCaret,
} from '@/editor/extensions/block-marker/marker-caret'
import type { MarkerCaret } from '@/editor/extensions/block-marker/marker-caret'
import { listMarkerSpec } from '@/editor/extensions/block-marker/specs'

/**
 * Narrows a resolved marker caret to one sitting on a list item's own marker.
 * A blockquote's `> ` resolves identically, so the spec's identity is the only
 * thing separating them - and everything below has to draw that line before it
 * can act on a list.
 */
function listItemCaret(caret: MarkerCaret | null): MarkerCaret | null {
	return caret?.spec === listMarkerSpec ? caret : null
}

/**
 * The list item whose marker the caret sits right after, or `null`. Tab only
 * nests list items, so a blockquote's marker boundary has to fall through to
 * plain indenting.
 */
export function listItemAtMarkerBoundary(editor: Editor): MarkerCaret | null {
	return listItemCaret(markerCaretAtBoundary(editor))
}

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
 * `end-blank-list-item.ts` exists to break.
 */
export function blankListItemAtCaret(editor: Editor): MarkerCaret | null {
	const caret = listItemCaret(resolveMarkerCaret(editor))
	if (!caret) return null
	if (caret.match.host.node.content.size !== caret.markerLength) return null
	if (caret.match.node.childCount !== 1) return null
	return caret
}
