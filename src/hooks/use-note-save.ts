import { useEffect } from 'react'
import { useDebounceValue } from 'usehooks-ts'

import { updateNotes } from '@/lib/update-notes'

const SAVE_DEBOUNCE_MS = 1000

type UseNoteSaveOptions = {
	isVSCodeContext: boolean
	saveContent: (content: string) => void
	/**
	 * The whole file as it stands right now, for Cmd/Ctrl+S. `null` means the
	 * caller has nothing to write yet, and the keystroke is ignored.
	 */
	currentFile: () => string | null
}

/**
 * Writes the note back, debounced, and immediately when the host asks.
 *
 * Takes the whole file rather than a document, so both the rich editor and the
 * raw markdown view can share one save path - the frontmatter split is the rich
 * editor's business and has already happened by the time text arrives here.
 */
export function useNoteSave({
	isVSCodeContext,
	saveContent,
	currentFile,
}: UseNoteSaveOptions) {
	// Seeded `null` rather than `''` so that emptying a note still saves; an
	// empty string is a legitimate document, not the absence of one.
	const [debouncedValue, queueSave] = useDebounceValue<string | null>(
		null,
		SAVE_DEBOUNCE_MS
	)

	// Cmd/Ctrl+S is caught on `window` by `useSaveShortcut` and re-broadcast as
	// this event, because the keystroke reaches the page rather than the editor.
	useEffect(() => {
		if (!isVSCodeContext) return

		const saveNow = () => {
			const file = currentFile()
			if (file !== null) saveContent(file)
		}

		window.addEventListener('vscode-save-request', saveNow)
		return () => window.removeEventListener('vscode-save-request', saveNow)
	}, [currentFile, isVSCodeContext, saveContent])

	useEffect(() => {
		if (debouncedValue === null) return

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

	return { queueSave, cancelQueuedSave: queueSave.cancel }
}
