import { RAW_MARKDOWN_EDITOR_ID } from '#src/editor/editor-mode-raw'

/**
 * Selects a range in the raw textarea and scrolls it into view, the raw
 * counterpart to the live editor's `setTextSelection().scrollIntoView()`
 * chain. Reached by DOM id rather than a ref, the same way
 * `skip-target.ts` already focuses this element.
 */
export function selectRawRange(from: number, to: number) {
	const textarea = document.getElementById(RAW_MARKDOWN_EDITOR_ID)
	if (!(textarea instanceof HTMLTextAreaElement)) return

	textarea.focus()
	textarea.setSelectionRange(from, to)
	textarea.scrollIntoView({ block: 'center' })
}
