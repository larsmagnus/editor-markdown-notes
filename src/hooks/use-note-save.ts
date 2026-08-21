import { useCallback, useEffect, useRef } from 'react'
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
	const [debouncedValue, debouncedQueueSave] = useDebounceValue<string | null>(
		null,
		SAVE_DEBOUNCE_MS
	)

	// The debounce library cancels its own pending timer the instant this hook
	// unmounts - which switching from the live editor to the raw editor does,
	// since it tears down the whole editor tree. Without tracking this
	// ourselves, an edit made in the second before the switch is cancelled
	// along with the timer and never reaches `saveContent` at all.
	const pendingRef = useRef(false)
	const queueSave = useCallback(
		(next: string) => {
			pendingRef.current = true
			debouncedQueueSave(next)
		},
		[debouncedQueueSave]
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
		pendingRef.current = false

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

	// Read through refs rather than taken as effect dependencies below: an
	// inline `currentFile`/`saveContent` is a new identity every render, and
	// depending on them directly would run the flush effect's cleanup on
	// every re-render the debounce firing causes - racing the effect above
	// that clears `pendingRef`, since React runs a commit's cleanups before
	// its new effects regardless of hook order.
	const currentFileRef = useRef(currentFile)
	currentFileRef.current = currentFile
	const saveContentRef = useRef(saveContent)
	saveContentRef.current = saveContent
	const isVSCodeContextRef = useRef(isVSCodeContext)
	isVSCodeContextRef.current = isVSCodeContext

	// The flush half of the comment above: whatever the cancelled timer would
	// have written, written directly instead - through the same VSCode/standalone
	// fork the debounce effect above uses, since `saveContent` posts to a VS
	// Code API that does not exist outside VSCode. Empty deps so this only runs
	// on the hook's actual unmount, not on every render.
	useEffect(() => {
		return () => {
			if (!pendingRef.current) return
			const file = currentFileRef.current()
			if (file === null) return

			if (isVSCodeContextRef.current) {
				saveContentRef.current(file)
				return
			}

			updateNotes(file).catch((error) => {
				console.error('Error saving markdown:', error)
			})
		}
	}, [])

	const cancelQueuedSave = useCallback(() => {
		pendingRef.current = false
		debouncedQueueSave.cancel()
	}, [debouncedQueueSave])

	return { queueSave, cancelQueuedSave }
}
