import type { Editor, KeyboardShortcutCommand } from '@tiptap/core'

/**
 * Wraps every shortcut so a non-empty selection always counts as handled.
 *
 * Toggle commands may decline to apply formatting when the selection is
 * ambiguous. But when text is selected, the user's intent is clearly to
 * format it, so we ensure formatting is applied regardless.
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
