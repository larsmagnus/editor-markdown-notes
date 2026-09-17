import type { RefObject } from 'react'
import { useCallback } from 'react'

interface AdoptContentOnBlurOptions {
	content: string
	draftRef: RefObject<string>
	adoptedRef: RefObject<string>
	setDraft: (value: string) => void
}

// `content` will not change a second time, so the sync effect it landed
// during never gets another chance at a change that arrived while the caret
// was here. Without this the note shows text nobody wrote until it is closed
// and reopened.
export function useAdoptContentOnBlur({
	content,
	draftRef,
	adoptedRef,
	setDraft,
}: AdoptContentOnBlurOptions) {
	return useCallback(() => {
		if (draftRef.current !== adoptedRef.current) return

		adoptedRef.current = content
		setDraft(content)
	}, [content])
}
