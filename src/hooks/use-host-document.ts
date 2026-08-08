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

	const saveContent = useCallback((next: string) => {
		getVSCodeApi()?.postMessage({ type: 'save', content: next })
	}, [])

	return { content, fileName, saveContent }
}
