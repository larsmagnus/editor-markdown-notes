import type { Editor, Range } from '@tiptap/core'

import { pickImage } from '@/lib/pick-image'
import { isVSCodeWebview } from '@/lib/vscode-api'

/** Inserts an empty, selected image node, for `ImagePopover` to open itself over. */
function insertEmptyImage(editor: Editor, range: Range) {
	const pos = range.from

	editor
		.chain()
		.focus()
		.deleteRange(range)
		.insertContentAt(pos, { type: 'image', attrs: { src: '' } })
		.setNodeSelection(pos)
		.run()
}

/**
 * The slash command's "image" action.
 *
 * In VS Code, opens the host's native file dialog and inserts whatever path
 * comes back. Outside VS Code there is no filesystem to pick from (the
 * standalone build's save path is already a stub, per CLAUDE.md), so this
 * inserts an empty image node instead and lets `ImagePopover` open itself
 * over it - the form the user actually sees, rather than what would
 * otherwise look like nothing happening at all.
 */
export function runInsertImageCommand(editor: Editor, range: Range) {
	if (!isVSCodeWebview()) {
		insertEmptyImage(editor, range)
		return
	}

	// The dialog is async, so the `/image` text is removed up front rather
	// than deferred to when it resolves - by then the caret may have moved,
	// and `range` is only valid against the document state the menu opened
	// with. The image is inserted at the current selection instead.
	editor.chain().focus().deleteRange(range).run()

	void pickImage().then((src) => {
		if (!src) return
		editor.chain().focus().setImage({ src }).run()
	})
}
