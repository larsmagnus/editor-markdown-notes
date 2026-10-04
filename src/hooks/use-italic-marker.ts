import type { Editor } from '@tiptap/react'
import { useEffect } from 'react'

import type { ItalicMarker } from '#src/shared/messages'

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

		// TipTap documents extension storage as mutable runtime state, reachable
		// from outside the extension through `editor.storage`. The editor is an
		// external system this effect synchronizes, not a hook argument to keep
		// immutable.
		// oxlint-disable-next-line react/immutability
		editor.storage.italic.preferredMarkup = marker
	}, [editor, marker])
}
