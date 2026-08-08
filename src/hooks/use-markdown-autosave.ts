import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useRef } from 'react'
import { useDebounceValue } from 'usehooks-ts'

import { joinFrontmatter } from '@/lib/frontmatter'
import { updateNotes } from '@/lib/update-notes'

const SAVE_DEBOUNCE_MS = 1000

type UseMarkdownAutosaveOptions = {
	editor: Editor | null
	frontmatter: string | null
	isVSCodeContext: boolean
	saveContent: (content: string) => void
}

/**
 * Saves the note, debounced, and immediately when the host asks.
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
	const [debouncedValue, setValue] = useDebounceValue('', SAVE_DEBOUNCE_MS)

	const frontmatterRef = useRef(frontmatter)
	frontmatterRef.current = frontmatter

	/**
	 * Queues a save of markdown the caller already has.
	 *
	 * `frontmatter` is worth passing whenever the caller is what just changed it:
	 * the ref is a render behind, so the panel's own edits would otherwise each be
	 * saved with the previous value and the last keystroke lost.
	 */
	const queueSave = useCallback(
		(markdown: string, frontmatter = frontmatterRef.current) =>
			setValue(joinFrontmatter(frontmatter, markdown)),
		[setValue]
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

	// Cmd/Ctrl+S is caught on `window` and re-broadcast as this event, because
	// the keystroke reaches the page rather than the editor.
	useEffect(() => {
		if (!isVSCodeContext || !editor) return

		const saveNow = () => {
			const markdown = editor.storage?.markdown?.getMarkdown()
			if (markdown)
				saveContent(joinFrontmatter(frontmatterRef.current, markdown))
		}

		window.addEventListener('vscode-save-request', saveNow)
		return () => window.removeEventListener('vscode-save-request', saveNow)
	}, [editor, isVSCodeContext, saveContent])

	useEffect(() => {
		if (!debouncedValue) return

		// In VSCode the host owns the file; standalone there is none, and
		// `updateNotes` is a stub.
		if (isVSCodeContext) {
			saveContent(debouncedValue)
			return
		}

		updateNotes(debouncedValue).catch((error) => {
			console.error('Error saving markdown:', error)
		})
	}, [debouncedValue, isVSCodeContext, saveContent])

	return { queueSave }
}
