import type { Editor } from '@tiptap/react'
import { useCallback, useEffect } from 'react'

import { useNoteSave } from '@/hooks/use-note-save'

type UseMarkdownAutosaveOptions = {
	editor: Editor | null
	isVSCodeContext: boolean
	saveContent: (content: string) => void
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
}: UseMarkdownAutosaveOptions) {
	const currentFile = useCallback(
		() => editor?.storage?.markdown?.getMarkdown() ?? null,
		[editor]
	)

	const { queueSave } = useNoteSave({
		isVSCodeContext,
		saveContent,
		currentFile,
	})

	useEffect(() => {
		if (!editor) return

		const queueCurrentDocument = () =>
			queueSave(editor.storage?.markdown?.getMarkdown() ?? '')

		editor.on('update', queueCurrentDocument)
		return () => {
			editor.off('update', queueCurrentDocument)
		}
	}, [editor, queueSave])
}
