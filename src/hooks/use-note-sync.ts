import { useCallback, useEffect, useRef } from 'react'
import { useDebounceValue } from 'usehooks-ts'

import { useHostMessage } from '@/hooks/use-host-message'
import { documentDirty } from '@/lib/document-dirty-tracker'
import { requestLatestMessageSchema } from '@/lib/schemas'
import { updateNotes } from '@/lib/update-notes'
import { getVSCodeApi } from '@/lib/vscode-api'

const SYNC_DEBOUNCE_MS = 1000

type UseNoteSyncOptions = {
	isVSCodeContext: boolean
	syncContent: (content: string) => void
	/**
	 * The whole file as it stands right now - for the first sync since a clean
	 * state, and for answering `requestLatest`. `null` means the caller has
	 * nothing to write yet.
	 */
	currentFile: () => string | null
	/** Whether this is the view currently on screen - see `EditorBody`. Only
	 *  the active view answers `requestLatest`; the inactive one's held text
	 *  can lag the debounce and would answer with stale content. */
	active: boolean
	/**
	 * Marks a `requestLatest` answer as this view's own, without syncing it -
	 * `syncContent` would work too, but it is a real write, and a save must
	 * never turn "what do you currently hold" into "write that back": the
	 * live editor's re-serialization of syntax it does not support (a
	 * footnote, say) would overwrite a file nobody actually asked it to
	 * change.
	 */
	recordOwnSync: (content: string) => void
}

/**
 * Syncs the note into the `TextDocument`, debounced.
 *
 * Takes the whole file rather than a document, so both the rich editor and the
 * raw markdown view can share one sync path - the frontmatter split is the rich
 * editor's business and has already happened by the time text arrives here.
 */
export function useNoteSync({
	isVSCodeContext,
	syncContent,
	currentFile,
	active,
	recordOwnSync,
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

			// VS Code does not save a clean document, so the very first edit since
			// the last save has to reach the `TextDocument` immediately - left to
			// the debounce, Cmd/Ctrl+S (or `files.autoSave`) landing inside that
			// window would find nothing dirty yet and silently do nothing.
			if (isVSCodeContext && !documentDirty.current) {
				documentDirty.current = true
				syncContent(next)
			}

			debouncedQueueSync(next)
		},
		[debouncedQueueSync, isVSCodeContext, syncContent]
	)

	// Answers a VS Code save's `onWillSaveTextDocument` participant, which
	// otherwise only has the last debounced sync - up to a second behind
	// whatever was just typed.
	useHostMessage(
		requestLatestMessageSchema,
		(message) => {
			// Nothing pending means the document already holds this view's
			// correct text - either it was already synced, or the current state
			// is only a freshly absorbed external change nobody typed. Answering
			// with `currentFile()` regardless would write this view's own
			// re-serialization of that external change (escaping a footnote,
			// say, or dropping its trailing newline) straight back over it.
			if (!pendingRef.current) {
				getVSCodeApi()?.postMessage({
					type: 'latestContent',
					requestId: message.requestId,
					content: null,
				})
				return
			}

			const file = currentFile()
			if (file === null) return

			// Recorded, not synced - the host may echo this text back (e.g.
			// touched up by a save hook), and without recording it here that echo
			// reads as an external change and rebuilds the document.
			recordOwnSync(file)

			getVSCodeApi()?.postMessage({
				type: 'latestContent',
				requestId: message.requestId,
				content: file,
			})
		},
		isVSCodeContext && active
	)

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
		pendingRef.current = false
		debouncedQueueSync.flush()
	}, [debouncedQueueSync])

	return { queueSync, cancelQueuedSync, flushQueuedSync }
}
