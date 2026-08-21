import { Extension } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { isInTable } from '@tiptap/pm/tables'

const INDENT = '  '

// `listItem`/`taskItem` bind Tab/Shift-Tab to sink/lift themselves, but
// `ExtensionManager` runs the last-registered extension's keymap first, so
// this extension (registered after them) would otherwise always shadow that.
const NESTABLE_LIST_ITEM_TYPES = ['listItem', 'taskItem']

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
 * nest/un-nest the item instead (see `NESTABLE_LIST_ITEM_TYPES` above).
 */
export const TabIndent = Extension.create({
	name: 'tabIndent',

	addKeyboardShortcuts() {
		const canIndent = () => {
			const { selection } = this.editor.state
			return selection instanceof TextSelection && !isInTable(this.editor.state)
		}

		// The item's type name, or `null` if the caret isn't right after its
		// bullet/number/checkbox (i.e. offset 0 of the item's first block).
		const listItemAtCaretStart = () => {
			const { selection } = this.editor.state
			if (!(selection instanceof TextSelection) || !selection.empty) return null

			const { $from } = selection
			if ($from.parentOffset !== 0 || $from.depth < 1) return null

			const itemDepth = $from.depth - 1
			const listItem = $from.node(itemDepth)

			if (!NESTABLE_LIST_ITEM_TYPES.includes(listItem.type.name)) return null
			if ($from.index(itemDepth) !== 0) return null

			return listItem.type.name
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
				const listItemType = listItemAtCaretStart()
				if (listItemType && this.editor.commands.sinkListItem(listItemType)) {
					return true
				}

				if (!canIndent()) return false

				return insertIndent()
			},
			'Shift-Tab': () => {
				const listItemType = listItemAtCaretStart()
				if (listItemType) {
					this.editor.commands.liftListItem(listItemType)
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
