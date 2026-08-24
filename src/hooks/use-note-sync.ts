import { useCallback, useEffect, useRef } from 'react'
import { useDebounceValue } from 'usehooks-ts'

import { updateNotes } from '@/lib/update-notes'

const SYNC_DEBOUNCE_MS = 1000

type UseNoteSyncOptions = {
	isVSCodeContext: boolean
	syncContent: (content: string) => void
	/**
	 * The whole file as it stands right now, for Cmd/Ctrl+S. `null` means the
	 * caller has nothing to write yet, and the keystroke is ignored.
	 */
	currentFile: () => string | null
}

/**
 * Syncs the note into the `TextDocument`, debounced, and immediately when the
 * host asks.
 *
 * Takes the whole file rather than a document, so both the rich editor and the
 * raw markdown view can share one sync path - the frontmatter split is the rich
 * editor's business and has already happened by the time text arrives here.
 */
export function useNoteSync({
	isVSCodeContext,
	syncContent,
	currentFile,
}: UseNoteSyncOptions) {
	// Seeded `null` rather than `''` so that emptying a note still syncs; an
	// empty string is a legitimate document, not the absence of one.
	const [debouncedValue, debouncedQueueSync] = useDebounceValue<string | null>(
		null,
		SYNC_DEBOUNCE_MS
	)

	// The debounce library cancels its own pending timer the instant this hook
	// unmounts - which switching from the live editor to the raw editor does,
	// since it tears down the whole editor tree. Without tracking this
	// ourselves, an edit made in the second before the switch is cancelled
	// along with the timer and never reaches `syncContent` at all.
	const pendingRef = useRef(false)
	const queueSync = useCallback(
		(next: string) => {
			pendingRef.current = true
			debouncedQueueSync(next)
		},
		[debouncedQueueSync]
	)

	// Cmd/Ctrl+S is caught on `window` by `useSaveShortcut` and re-broadcast as
	// this event, because the keystroke reaches the page rather than the editor.
	useEffect(() => {
		if (!isVSCodeContext) return

		const syncNow = () => {
			const file = currentFile()
			if (file !== null) syncContent(file)
		}

		window.addEventListener('vscode-save-request', syncNow)
		return () => window.removeEventListener('vscode-save-request', syncNow)
	}, [currentFile, isVSCodeContext, syncContent])

	useEffect(() => {
		if (debouncedValue === null) return
		pendingRef.current = false

		// In VSCode the host owns the file; standalone there is none, and
		// `updateNotes` is a stub.
		if (isVSCodeContext) {
			syncContent(debouncedValue)
			return
		}

		updateNotes(debouncedValue).catch((error) => {
			console.error('Error saving markdown:', error)
		})
	}, [debouncedValue, isVSCodeContext, syncContent])

	// Read through refs rather than taken as effect dependencies below: an
	// inline `currentFile`/`syncContent` is a new identity every render, and
	// depending on them directly would run the flush effect's cleanup on
	// every re-render the debounce firing causes - racing the effect above
	// that clears `pendingRef`, since React runs a commit's cleanups before
	// its new effects regardless of hook order.
	const currentFileRef = useRef(currentFile)
	currentFileRef.current = currentFile
	const syncContentRef = useRef(syncContent)
	syncContentRef.current = syncContent
	const isVSCodeContextRef = useRef(isVSCodeContext)
	isVSCodeContextRef.current = isVSCodeContext

	// The flush half of the comment above: whatever the cancelled timer would
	// have written, written directly instead - through the same VSCode/standalone
	// fork the debounce effect above uses, since `syncContent` posts to a VS
	// Code API that does not exist outside VSCode. Empty deps so this only runs
	// on the hook's actual unmount, not on every render.
	useEffect(() => {
		return () => {
			if (!pendingRef.current) return
			const file = currentFileRef.current()
			if (file === null) return

			if (isVSCodeContextRef.current) {
				syncContentRef.current(file)
				return
			}

			updateNotes(file).catch((error) => {
				console.error('Error saving markdown:', error)
			})
		}
	}, [])

	const cancelQueuedSync = useCallback(() => {
		pendingRef.current = false
		debouncedQueueSync.cancel()
	}, [debouncedQueueSync])

	// Both editor modes stay mounted at once now (`EditorBody`), so neither
	// unmounts on a toggle any more - the flush-on-unmount effect above no
	// longer fires for that case, only for a real tab close. A caller that
	// hides its own view instead has to flush explicitly, or a keystroke made
	// just before switching away is stuck behind a debounce nothing is left to
	// fire. `.flush()` is a no-op when nothing is pending.
	const flushQueuedSync = useCallback(() => {
		debouncedQueueSync.flush()
	}, [debouncedQueueSync])

	return { queueSync, cancelQueuedSync, flushQueuedSync }
}
