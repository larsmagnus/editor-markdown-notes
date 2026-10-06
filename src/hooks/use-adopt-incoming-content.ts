import type { RefObject } from 'react'
import { useEffect } from 'react'

import { useCarriedSelection } from '#src/hooks/use-carried-selection'

interface AdoptIncomingContentOptions {
	content: string
	draft: string
	draftRef: RefObject<string>
	adoptedRef: RefObject<string>
	setDraft: (value: string) => void
	textareaRef: RefObject<HTMLTextAreaElement | null>
	/** True in VS Code, where every write goes through the host and
	 *  updates `adoptedRef`, so draft !== adoptedRef reliably indicates
	 *  unsynced keystrokes. */
	isVSCodeContext: boolean
}

/**
 * Takes each new `content` into raw mode's draft, unless the author has
 * anything pending.
 *
 * The host echoes every sync back as an `update`, and that echo is a debounce
 * behind the keystrokes still arriving - adopting it mid-edit would reset both
 * the text and the caret. With nothing pending a focused textarea adopts too,
 * caret carried over: a switch from live mode focuses this view before live
 * mode's last keystrokes have reached it.
 *
 * Standalone, writes reach no host and `adoptedRef` never follows them, so it
 * cannot tell pending keystrokes from a finished edit. There `content` only
 * changes when the file selector picks another note, which an unfocused view
 * always takes.
 */
export function useAdoptIncomingContent({
	content,
	draft,
	draftRef,
	adoptedRef,
	setDraft,
	textareaRef,
	isVSCodeContext,
}: AdoptIncomingContentOptions) {
	const carrySelectionTo = useCarriedSelection(draft)

	useEffect(() => {
		const textarea = textareaRef.current
		const focused = textarea !== null && document.activeElement === textarea
		const hasUnsynced = draftRef.current !== adoptedRef.current
		if (hasUnsynced && (focused || isVSCodeContext)) return
		if (focused) carrySelectionTo(textarea, content)

		adoptedRef.current = content
		setDraft(content)
	}, [
		adoptedRef,
		carrySelectionTo,
		content,
		draftRef,
		isVSCodeContext,
		setDraft,
		textareaRef,
	])
}
