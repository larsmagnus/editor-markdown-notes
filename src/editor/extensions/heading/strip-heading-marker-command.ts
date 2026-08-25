import type { Command } from '@tiptap/pm/state'

import { headingMarkerLength } from '@/editor/extensions/heading/heading-marker'

/**
 * Strips the current block's marker text if it's a heading, otherwise a
 * no-op - `setParagraph` only changes node type, so without this the
 * marker's now-real text survives the switch and a heading toggled off via
 * the generic "paragraph" style (`text-style-commands.ts`) reads back as a
 * paragraph that literally starts with `## `.
 */
export const stripHeadingMarkerCommand: Command = (state, dispatch) => {
	const { $from } = state.selection
	if ($from.parent.type.name !== 'heading') return true

	const markerLength = headingMarkerLength($from.parent.textContent)
	if (markerLength === 0) return true

	if (dispatch) {
		const pos = $from.before()
		dispatch(state.tr.delete(pos + 1, pos + 1 + markerLength))
	}
	return true
}
