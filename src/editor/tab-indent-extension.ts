import { Extension } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { isInTable } from '@tiptap/pm/tables'

const INDENT = '  '

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
 */
export const TabIndent = Extension.create({
	name: 'tabIndent',

	addKeyboardShortcuts() {
		const canIndent = () => {
			const { selection } = this.editor.state
			return selection instanceof TextSelection && !isInTable(this.editor.state)
		}

		return {
			Tab: () => {
				if (!canIndent()) return false

				// Not `insertContent`: a whitespace-only string is valid markdown for
				// "nothing" and parses away to a no-op silently. `insertText` writes
				// the literal characters, bypassing markdown parsing entirely.
				return this.editor.commands.command(({ tr, dispatch }) => {
					if (dispatch) dispatch(tr.insertText(INDENT))
					return true
				})
			},
			'Shift-Tab': () => {
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
