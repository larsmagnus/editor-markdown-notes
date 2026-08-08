import type { Editor } from '@tiptap/react'
import { useEffect, useState } from 'react'
import { useDebounceValue } from 'usehooks-ts'

/**
 * Long enough that the analysis lands in a typing pause rather than between two
 * keystrokes, short enough that it feels immediate once you stop.
 */
const ANALYSIS_DEBOUNCE_MS = 500

/**
 * A number that changes when the document does, settling after typing stops.
 *
 * A counter rather than the document itself: `useDebounceValue` compares by
 * identity, and every transaction produces a fresh doc object.
 */
export function useDocumentRevision(editor: Editor | null): number {
	const [revision, setRevision] = useState(0)
	const [debounced, setDebounced] = useDebounceValue(0, ANALYSIS_DEBOUNCE_MS)

	useEffect(() => {
		setDebounced(revision)
	}, [revision, setDebounced])

	useEffect(() => {
		if (!editor) return

		const bump = () => setRevision((current) => current + 1)

		editor.on('update', bump)
		return () => {
			editor.off('update', bump)
		}
	}, [editor])

	return debounced
}
