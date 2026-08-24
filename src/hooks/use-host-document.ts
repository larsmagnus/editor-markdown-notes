import { useCallback, useEffect, useState } from 'react'

import { useHostMessage } from '@/hooks/use-host-message'
import { documentDirty } from '@/lib/document-dirty-tracker'
import { documentSavedMessageSchema, updateMessageSchema } from '@/lib/schemas'
import { getVSCodeApi, isVSCodeWebview } from '@/lib/vscode-api'

/**
 * The note the host has open, and the way to write it back.
 *
 * Seeded from the globals the host injects ahead of the bundle, so the first
 * render already has the document rather than an empty editor.
 */
export function useHostDocument() {
	const [content, setContent] = useState(() => window.initialContent ?? '')
	const [fileName, setFileName] = useState(() => window.fileName ?? '')

	// Those globals are frozen into the page when the note first opens, and a
	// window reload or reopening a closed tab rebuilds the page from that same
	// frozen HTML - so a page that just booted cannot tell whether it is
	// showing the file or a snapshot of it from an hour ago. Asking on every
	// boot is what closes that gap. `retainContextWhenHidden`
	// (`markdown-editor-provider.ts`) means backgrounding the tab no longer
	// triggers this at all - the page keeps running, and `postMessage` reaches
	// it whether or not it is currently visible. Only a freshly booted page
	// asks, which is why this is safe where a host-side push on visibility is
	// not - that would also hit pages whose context survived, still holding up
	// to a debounce of unsynced keystrokes.
	useEffect(() => {
		if (!isVSCodeWebview()) return

		getVSCodeApi()?.postMessage({ type: 'getContent' })
	}, [])

	useHostMessage(
		updateMessageSchema,
		(message) => {
			setContent(message.content)
			setFileName(message.fileName)
		},
		isVSCodeWebview()
	)

	// The one signal `documentDirty` (`use-note-sync.ts`) has for "the
	// `TextDocument` is clean again" - without it, the first edit after every
	// save but the very first would find the document still marked dirty from
	// before, and never sync immediately ahead of its debounce.
	useHostMessage(
		documentSavedMessageSchema,
		() => {
			documentDirty.current = false
		},
		isVSCodeWebview()
	)

	// Applying `next` here too, not just posting it, keeps `content` current for
	// readers like the toolbar's copy actions - the host's own echo of this
	// write is deliberately suppressed (`DocumentWriter.matchesLastWrite`), so
	// without this, `content` would otherwise sit stale until the next external
	// change. `syncContent` itself only runs on `useNoteSync`'s 1000ms debounce,
	// so `content` can still lag the very latest keystroke by up to that window
	// - the same latency the `TextDocument` already has, not a new gap this
	// closes.
	const syncContent = useCallback((next: string) => {
		setContent(next)
		getVSCodeApi()?.postMessage({ type: 'syncDocument', content: next })
	}, [])

	return { content, fileName, syncContent }
}
