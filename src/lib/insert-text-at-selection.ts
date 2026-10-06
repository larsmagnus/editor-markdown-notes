/**
 * Replaces the textarea's selection with `text` and puts the caret `caretOffset`
 * into it (the end by default).
 *
 * Goes through `execCommand` because it is the only write that joins the
 * browser's undo stack, and it raises a real `input` event so the controlled
 * textarea's `onChange` syncs the edit like typing. The fallback covers hosts
 * without it.
 */
export function insertTextAtSelection(
	textarea: HTMLTextAreaElement,
	text: string,
	caretOffset: number = text.length
): void {
	const start = textarea.selectionStart
	textarea.focus()
	if (!document.execCommand('insertText', false, text)) {
		textarea.setRangeText(text, start, textarea.selectionEnd, 'end')
		textarea.dispatchEvent(new Event('input', { bubbles: true }))
	}
	textarea.setSelectionRange(start + caretOffset, start + caretOffset)
}
