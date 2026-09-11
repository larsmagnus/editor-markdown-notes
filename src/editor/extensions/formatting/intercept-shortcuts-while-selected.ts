import type { Editor, KeyboardShortcutCommand } from '@tiptap/core'

/**
 * Wraps every shortcut so a non-empty selection always counts as handled.
 *
 * A toggle command may decline (return `false`) when a selection has no
 * single right answer - see `toggleDelimitedMark`'s doc comment. TipTap only
 * calls `preventDefault` on a shortcut that returns `true`, so a declined
 * toggle falls through to the host application's own binding for the same
 * key (VS Code's Cmd-B collapses the sidebar). A selection means the reader
 * meant this editor to have the keystroke regardless of what the toggle did
 * with it.
 */
export function interceptShortcutsWhileSelected(
	editor: Editor,
	shortcuts: Record<string, KeyboardShortcutCommand>
): Record<string, KeyboardShortcutCommand> {
	return Object.fromEntries(
		Object.entries(shortcuts).map(([shortcut, toggle]) => [
			shortcut,
			(props: { editor: Editor }) =>
				toggle(props) || !editor.state.selection.empty,
		])
	)
}
