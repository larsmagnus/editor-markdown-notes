import type { Editor } from '@tiptap/core'

import { markerCaretInMarker } from '#src/editor/extensions/block-marker/marker-caret'

/** Prevents half-marker fragmentation when splitting list items. */
export function splitAfterMarker(editor: Editor): boolean {
	const caret = markerCaretInMarker(editor)
	if (!caret) return false

	if (caret.parentOffset === caret.markerLength) return false

	return editor
		.chain()
		.setTextSelection(caret.markerStart + caret.markerLength)
		.splitListItem(caret.nodeTypeName)
		.run()
}
