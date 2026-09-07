import type { Editor } from '@tiptap/core'
import type { Command } from '@tiptap/pm/state'

/**
 * Binds a bare ProseMirror command to the editor, for a keymap entry that has
 * one to run rather than a TipTap command to chain.
 *
 * The view is passed through, not just the state and dispatch: whether there is
 * another line to reach, or another image to step to, is a question about
 * layout that only the view can answer.
 */
export function commandRunner(editor: Editor) {
	return (command: Command) => () =>
		command(editor.state, editor.view.dispatch, editor.view)
}
