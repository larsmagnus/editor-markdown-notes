import type { Editor } from '@tiptap/core'
import { Extension } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { isInTable } from '@tiptap/pm/tables'

import { markerCaretAtBoundary } from '@/editor/extensions/block-marker/marker-caret'
import type { MarkerCaret } from '@/editor/extensions/block-marker/marker-caret'
import { listMarkerSpec } from '@/editor/extensions/block-marker/specs'
import { outdentListItem } from '@/editor/extensions/list/outdent-list-item'

const INDENT = '  '

/**
 * The list item whose marker the caret sits right after, or `null`. Tab only
 * nests list items, so a blockquote's marker boundary - which resolves
 * identically - has to fall through to plain indenting.
 */
function listItemAtMarkerBoundary(editor: Editor): MarkerCaret | null {
	const caret = markerCaretAtBoundary(editor)
	return caret?.spec === listMarkerSpec ? caret : null
}

/**
 * Makes Tab behave like an editor, not a web page, wherever there's a real
 * text caret: it inserts an indent instead of moving focus to the next
 * focusable element, which is what an unhandled Tab does by default in any
 * contentEditable region.
 *
 * Declines (returns `false`) for anything that isn't a plain, in-place
 * `TextSelection` - a `NodeSelection` (an image selected, say) already has
 * its own Tab meaning elsewhere (`extensions.ts`'s image keyboard shortcuts),
 * and a table cell keeps whatever Tab does there today rather than gaining a
 * competing, unrelated meaning here.
 *
 * Right after a list item's bullet, number, or checkbox, Tab/Shift-Tab
 * nest/un-nest the item instead (`listItemAtMarkerBoundary`). Un-nesting goes
 * through `outdentListItem` rather than `liftListItem` directly, since an item
 * with no outer list to land in has to shed its marker on the way out.
 */
export const TabIndent = Extension.create({
	name: 'tabIndent',

	addKeyboardShortcuts() {
		const canIndent = () => {
			const { selection } = this.editor.state
			return selection instanceof TextSelection && !isInTable(this.editor.state)
		}

		const insertIndent = () =>
			// Not `insertContent`: a whitespace-only string is valid markdown for
			// "nothing" and parses away to a no-op silently. `insertText` writes
			// the literal characters, bypassing markdown parsing entirely.
			this.editor.commands.command(({ tr, dispatch }) => {
				if (dispatch) dispatch(tr.insertText(INDENT))
				return true
			})

		return {
			Tab: () => {
				const listItem = listItemAtMarkerBoundary(this.editor)
				if (
					listItem &&
					this.editor.commands.sinkListItem(listItem.nodeTypeName)
				) {
					return true
				}

				if (!canIndent()) return false

				return insertIndent()
			},
			'Shift-Tab': () => {
				const listItem = listItemAtMarkerBoundary(this.editor)
				if (listItem) {
					outdentListItem(this.editor, listItem)
					return true
				}

				if (!canIndent()) return false

				const { from } = this.editor.state.selection
				const start = Math.max(0, from - INDENT.length)
				const precedingText = this.editor.state.doc.textBetween(start, from)

				// Swallowed either way - Shift-Tab keeping focus put wherever it is
				// beats letting an unhandled key escape it, even with nothing to
				// outdent.
				if (precedingText !== INDENT) return true

				return this.editor.commands.deleteRange({ from: start, to: from })
			},
		}
	},
})
