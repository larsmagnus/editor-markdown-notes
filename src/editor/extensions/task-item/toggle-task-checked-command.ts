import type { Command } from '@tiptap/pm/state'

import {
	firstParagraphStart,
	parseListMarker,
	taskMarkerText,
} from '#src/editor/extensions/list/list-marker'

/** Offset of the `[ ]`/`[x]` state character within a task marker (`- [x] `). */
const CHECKED_CHAR_OFFSET = 3

/**
 * Flips a task item's checked state by editing its own marker text directly
 * - the checkbox UI's route into the same "text is the source of truth" model
 * every other edit to a task item's marker goes through. `create-marker-sync-
 * plugin.ts` picks up the resulting text/attr mismatch afterward and
 * resyncs `checked` to match, the same one-directional flow typing an `x`
 * into the bracket by hand produces.
 */
export function createToggleTaskCheckedCommand(
	itemPos: number,
	checked: boolean
): Command {
	return (state, dispatch) => {
		const node = state.doc.nodeAt(itemPos)
		const paragraph = node?.firstChild
		if (!paragraph || paragraph.type.name !== 'paragraph') return false

		const paragraphStart = firstParagraphStart(itemPos)
		const parsed = parseListMarker(paragraph.textContent)

		if (!dispatch) return true

		const tr = state.tr
		if (parsed?.kind === 'task') {
			const at = paragraphStart + CHECKED_CHAR_OFFSET
			tr.insertText(checked ? 'x' : ' ', at, at + 1)
		} else {
			tr.insertText(
				taskMarkerText(checked),
				paragraphStart,
				paragraphStart + (parsed?.markerLength ?? 0)
			)
		}
		dispatch(tr)
		return true
	}
}
