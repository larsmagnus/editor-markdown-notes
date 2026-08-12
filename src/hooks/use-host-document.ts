import { useCallback, useState } from 'react'

import { useHostMessage } from '@/hooks/use-host-message'
import { updateMessageSchema } from '@/lib/schemas'
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

	useHostMessage(
		updateMessageSchema,
		(message) => {
			setContent(message.content)
			setFileName(message.fileName)
		},
		isVSCodeWebview()
	)

	// Applying `next` here too, not just posting it, keeps `content` current for
	// readers like the toolbar's copy actions - the host's own echo of this
	// write is deliberately suppressed (`DocumentWriter.isWriting`), so without
	// this, `content` would otherwise sit stale until the next external change.
	// `saveContent` itself only runs on `useNoteSave`'s 1000ms save debounce, so
	// `content` can still lag the very latest keystroke by up to that window -
	// the same latency the file on disk already has, not a new gap this closes.
	const saveContent = useCallback((next: string) => {
		setContent(next)
		getVSCodeApi()?.postMessage({ type: 'save', content: next })
	}, [])

	return { content, fileName, saveContent }
}
