/** Ctrl/Cmd+Z and Ctrl/Cmd+Y, matched the way VS Code's webview host matches them. */
function isUndoRedo(event: KeyboardEvent): boolean {
	return (
		(event.ctrlKey || event.metaKey) &&
		['z', 'y'].includes(event.key.toLowerCase())
	)
}

/**
 * Keeps undo and redo inside the page.
 *
 * VS Code's webview host listens for these keys on the window and answers
 * them with its own undo - of the `TextDocument`, which undid the editor's
 * last sync into the file while the editor undid the same keystrokes itself,
 * and the file's undo came back moments later as an outside change reverting
 * more than the author asked. Stopped at the document, the keys still reach
 * ProseMirror and the raw textarea first, whose own histories are the ones
 * the author is stepping through.
 */
export function keepUndoInPage(target: Document): void {
	target.addEventListener('keydown', (event) => {
		if (isUndoRedo(event)) event.stopPropagation()
	})
}
