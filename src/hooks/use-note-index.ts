import { useEffect, useMemo, useState } from 'react'

import { useHostMessage } from '#src/hooks/use-host-message'
import { useSettings } from '#src/hooks/use-settings'
import { summarizeNote } from '#src/lib/host/note-summary'
import {
	noteIndexFailedMessageSchema,
	noteIndexMessageSchema,
} from '#src/lib/schemas'
import { getVSCodeApi } from '#src/lib/vscode-api'
import type { NoteIndex } from '#src/shared/messages'

type DemoFile = { value: string; content: string }

type UseNoteIndexOptions = {
	open: boolean
	/** The standalone app's demo notes; empty inside VS Code. */
	files: DemoFile[]
	fileName: string
}

/**
 * The notes the index lists, `null` while they are being found, and whether
 * the host failed to find them at all.
 *
 * Inside VS Code the host is asked afresh every time the index opens, so it
 * never shows a note that has since been renamed or deleted. Standalone, the
 * demo notes are all there is.
 */
export function useNoteIndex({ open, files, fileName }: UseNoteIndexOptions): {
	index: NoteIndex | null
	failed: boolean
} {
	const { isVSCodeContext } = useSettings()
	const [hostIndex, setHostIndex] = useState<NoteIndex | null>(null)
	const [failed, setFailed] = useState(false)
	const demoIndex = useMemo(
		() => buildDemoIndex(files, fileName),
		[files, fileName]
	)

	useHostMessage(
		noteIndexMessageSchema,
		({ entries, total }) => setHostIndex({ entries, total }),
		isVSCodeContext && open
	)
	useHostMessage(
		noteIndexFailedMessageSchema,
		() => setFailed(true),
		isVSCodeContext && open
	)

	useEffect(() => {
		if (!isVSCodeContext || !open) return

		setHostIndex(null)
		setFailed(false)
		getVSCodeApi()?.postMessage({ type: 'getNoteIndex' })
	}, [isVSCodeContext, open])

	return isVSCodeContext
		? { index: hostIndex, failed }
		: { index: demoIndex, failed: false }
}

/** The demo notes have no folder or edit time, only their fetched text. */
function buildDemoIndex(files: DemoFile[], fileName: string): NoteIndex {
	const entries = files.map(({ value, content }) => ({
		...summarizeNote(content, value),
		uri: value,
		fileName: value,
		directory: '',
		modified: null,
		size: content.length,
		current: value === fileName,
	}))

	return { entries, total: entries.length }
}
