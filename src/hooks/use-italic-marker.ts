import type { Editor } from '@tiptap/react'
import { useEffect } from 'react'

import type { ItalicMarker } from '@/shared/messages'

/**
 * Mirrors the configured italic marker into the editor's storage.
 *
 * The italic mark reads this at the moment a new italic is created. `extensions`
 * is built once, so mutable storage is the only way for a live change to
 * `editorMarkdownNotes.italicMarker` to reach it.
 */
export function useItalicMarker(editor: Editor | null, marker: ItalicMarker) {
	useEffect(() => {
		if (!editor) return

		editor.storage.italic.preferredMarkup = marker
	}, [editor, marker])
}
