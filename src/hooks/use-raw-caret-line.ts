import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

import { lineIndexAt } from '#src/lib/line-index-at'

/**
 * The logical line the raw textarea's caret is on, for the gutter to
 * emphasise, or `null` while the textarea is unfocused. `selectionchange`
 * fires on the document, not the textarea, and covers typing, arrow keys and
 * clicks alike; it is filtered to the textarea so a selection elsewhere on
 * the page doesn't move it.
 */
export function useRawCaretLine(
	textareaRef: RefObject<HTMLTextAreaElement | null>
): number | null {
	const [line, setLine] = useState<number | null>(null)

	useEffect(() => {
		const textarea = textareaRef.current
		if (!textarea) return

		function syncLine() {
			if (!textarea || document.activeElement !== textarea) return
			setLine(lineIndexAt(textarea.value, textarea.selectionStart))
		}
		function clearLine() {
			setLine(null)
		}

		document.addEventListener('selectionchange', syncLine)
		textarea.addEventListener('input', syncLine)
		textarea.addEventListener('blur', clearLine)
		return () => {
			document.removeEventListener('selectionchange', syncLine)
			textarea.removeEventListener('input', syncLine)
			textarea.removeEventListener('blur', clearLine)
		}
	}, [textareaRef])

	return line
}
