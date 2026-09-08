import type { Editor } from '@tiptap/core'

import { blankListItemAtCaret } from '#src/editor/extensions/list/list-item-caret'
import { outdentListItem } from '#src/editor/extensions/list/outdent-list-item'

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
