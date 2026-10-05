import type { KeyboardEvent } from 'react'

/**
 * Keeps Select All inside the label being edited. The label is an editing host
 * nested in ProseMirror's own, and the browser answers Select All from the
 * outermost one - so left alone, the next keystroke replaces the whole note.
 */
export function keepSelectAllInLabel(event: KeyboardEvent): void {
	const target = event.target
	const isSelectAll =
		(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a'
	if (!isSelectAll) return
	if (!(target instanceof HTMLElement) || !target.isContentEditable) return

	event.preventDefault()
	const range = document.createRange()
	range.selectNodeContents(target)
	const selection = window.getSelection()
	selection?.removeAllRanges()
	selection?.addRange(range)
}
