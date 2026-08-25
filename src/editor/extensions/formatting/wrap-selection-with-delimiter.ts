import type { MarkType } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'

/**
 * Wraps a non-empty selection in literal delimiter text and marks the whole
 * thing, delimiters included - `**bold**` all carrying the `bold` mark, not
 * a `bold` mark on bare text with plain delimiters beside it. Marking the
 * delimiters too, not just the interior, is what lets the mark's own
 * `escape: false` (see `delimited-mark-extension.ts`) keep `prosemirror-markdown`'s
 * default escaping from mangling them into `\*\*bold\*\*` on save - that
 * escaping has no way to tell a coincidental double-asterisk in prose apart
 * from a real delimiter unless the delimiter carries a mark of its own.
 *
 * Declines on an empty selection: creating a mark at a bare caret (typing
 * delimiters that reveal/hide as you keep typing) is a separate, harder
 * problem (see `toggle-delimited-mark.ts`'s doc comment) - this command only
 * handles "select text, then apply a style."
 */
export function wrapSelectionWithDelimiter(
	markType: MarkType,
	delimiter: string
): Command {
	return (state, dispatch) => {
		const { selection } = state
		if (selection.empty) return false

		const { from, to } = selection

		if (dispatch) {
			const tr = state.tr
			const mark = markType.create()
			// Closing delimiter first: inserting at `from` shifts `to`, but
			// nothing shifts a position already past it.
			tr.insert(to, state.schema.text(delimiter, [mark]))
			tr.insert(from, state.schema.text(delimiter, [mark]))
			tr.addMark(from, to + delimiter.length * 2, mark)
			dispatch(tr)
		}
		return true
	}
}
