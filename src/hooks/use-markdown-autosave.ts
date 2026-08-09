import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useRef } from 'react'

import { useNoteSave } from '@/hooks/use-note-save'
import { joinFrontmatter } from '@/lib/frontmatter'

type UseMarkdownAutosaveOptions = {
	editor: Editor | null
	frontmatter: string | null
	isVSCodeContext: boolean
	saveContent: (content: string) => void
}

/**
 * Autosaves the TipTap document, frontmatter and all.
 *
 * Subscribes to the editor rather than taking an `onUpdate` handler, so nothing
 * has to be threaded back into `useEditor` before this hook has run. The
 * frontmatter is read through a ref for the same reason: it changes far more
 * often than the subscription should be rebuilt.
 */
export function useMarkdownAutosave({
	editor,
	frontmatter,
	isVSCodeContext,
	saveContent,
}: UseMarkdownAutosaveOptions) {
	const frontmatterRef = useRef(frontmatter)
	frontmatterRef.current = frontmatter

	const currentFile = useCallback(() => {
		const markdown = editor?.storage?.markdown?.getMarkdown()
		if (markdown === undefined) return null

		return joinFrontmatter(frontmatterRef.current, markdown)
	}, [editor])

	const { queueSave: queueFile } = useNoteSave({
		isVSCodeContext,
		saveContent,
		currentFile,
	})

	/**
	 * Queues a save of markdown the caller already has.
	 *
	 * `frontmatter` is worth passing whenever the caller is what just changed it:
	 * the ref is a render behind, so the panel's own edits would otherwise each be
	 * saved with the previous value and the last keystroke lost.
	 */
	const queueSave = useCallback(
		(markdown: string, frontmatter = frontmatterRef.current) =>
			queueFile(joinFrontmatter(frontmatter, markdown)),
		[queueFile]
	)

	useEffect(() => {
		if (!editor) return

		const queueCurrentDocument = () =>
			queueSave(editor.storage?.markdown?.getMarkdown() ?? '')

		editor.on('update', queueCurrentDocument)
		return () => {
			editor.off('update', queueCurrentDocument)
		}
	}, [editor, queueSave])

	return { queueSave }
}
