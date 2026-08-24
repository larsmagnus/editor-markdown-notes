import type { Editor, EditorEvents } from '@tiptap/react'
import { useCallback, useEffect } from 'react'

import { CONTENT_SYNC_META } from '@/hooks/use-frontmatter-document'
import { useNoteSave } from '@/hooks/use-note-save'

type UseMarkdownAutosaveOptions = {
	editor: Editor | null
	isVSCodeContext: boolean
	saveContent: (content: string) => void
	/** Off while this editor is mounted but hidden behind the other mode - see
	 *  `EditorBody`. A hidden editor only ever changes by absorbing an incoming
	 *  content sync (`CONTENT_SYNC_META`, already skipped below), so this is
	 *  belt-and-braces against anything else that might one day dispatch a
	 *  transaction on it unattended. */
	enabled: boolean
}

/**
 * Autosaves the TipTap document, frontmatter and all.
 *
 * Subscribes to the editor rather than taking an `onUpdate` handler, so nothing
 * has to be threaded back into `useEditor` before this hook has run.
 * Frontmatter is a real node in the document, so `getMarkdown()` alone
 * reproduces the whole file - there is no separate frontmatter state to stitch
 * back in before saving.
 */
export function useMarkdownAutosave({
	editor,
	isVSCodeContext,
	saveContent,
	enabled,
}: UseMarkdownAutosaveOptions) {
	const currentFile = useCallback(
		() => editor?.storage?.markdown?.getMarkdown() ?? null,
		[editor]
	)

	const { queueSave, cancelQueuedSave, flushQueuedSave } = useNoteSave({
		isVSCodeContext,
		saveContent,
		currentFile,
	})

	useEffect(() => {
		if (!editor || !enabled) return

		const queueCurrentDocument = ({ transaction }: EditorEvents['update']) => {
			// The host's own text, not the author's. Writing it back would replace
			// the file with this editor's re-serialization of it, and any save
			// queued before it is now about a document that no longer exists.
			if (transaction.getMeta(CONTENT_SYNC_META)) {
				cancelQueuedSave()
				return
			}

			queueSave(editor.storage?.markdown?.getMarkdown() ?? '')
		}

		editor.on('update', queueCurrentDocument)
		return () => {
			editor.off('update', queueCurrentDocument)
		}
	}, [cancelQueuedSave, editor, enabled, queueSave])

	return { flushQueuedSave }
}
