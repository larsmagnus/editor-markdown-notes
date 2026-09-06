import type { Command } from '@tiptap/pm/state'

import { headingMarkerLength } from '@/editor/extensions/heading/heading-marker'

/**
 * Strips every heading block the selection touches of its marker text,
 * otherwise a no-op - `setParagraph` only changes node type, so without this
 * the marker's now-real text survives the switch and a heading toggled off
 * via the generic "paragraph" style (`text-style-commands.ts`) reads back as
 * a paragraph that literally starts with `## `. Covers the whole selection,
 * not just its starting block: `setParagraph` itself converts every
 * textblock the selection spans, and this must match that scope or a
 * multi-heading selection leaves every block after the first with its
 * marker still in place.
 *
 * Blocks are stripped in *reverse* document order - the same reason
 * the marker sync plugin is - so deleting a later block's marker never
 * shifts an earlier block's already-read position.
 */
export const stripHeadingMarkerCommand: Command = (state, dispatch) => {
	const { $from, $to } = state.selection
	const range = $from.blockRange($to)
	if (!range) return true

	const headings: { pos: number; markerLength: number }[] = []
	state.doc.nodesBetween(range.start, range.end, (node, pos) => {
		if (node.type.name !== 'heading') return
		const markerLength = headingMarkerLength(node.textContent)
		if (markerLength > 0) headings.push({ pos, markerLength })
	})
	if (headings.length === 0) return true

	if (dispatch) {
		const tr = state.tr
		for (const { pos, markerLength } of headings.reverse()) {
			tr.delete(pos + 1, pos + 1 + markerLength)
		}
		dispatch(tr)
	}
	return true
}
