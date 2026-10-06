import { createOffsetMap } from '#src/lib/mode-switch/align-offsets'

/**
 * Reads `textarea`'s selection in `before` now, and returns what puts it back
 * on the same text once the textarea holds `after`.
 */
export function carrySelection(
	textarea: HTMLTextAreaElement,
	before: string,
	after: string
): () => void {
	const { selectionStart, selectionEnd, selectionDirection } = textarea
	const map = createOffsetMap(before, after)
	const start = map(selectionStart)
	const end = map(selectionEnd)

	return () => textarea.setSelectionRange(start, end, selectionDirection)
}
