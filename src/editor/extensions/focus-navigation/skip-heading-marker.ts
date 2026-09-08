import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { FocusDirection } from '#src/editor/extensions/focus-navigation/focusable-elements'
import { headingMarkerLength } from '#src/editor/extensions/heading/heading-marker'

/**
 * `pos` landing exactly at a heading's start (entering from outside the
 * editor, or moving past a leading widget's button into one) would sit
 * before its own leading marker - real text now (see `heading-marker.ts`),
 * not markup added at save time - and typing there breaks the marker rather
 * than extending the heading's own text. Advancing past it only when moving
 * forward into that exact position keeps `Shift-Tab` landing at a heading's
 * true end untouched.
 */
export function skipHeadingMarker(
	doc: ProseMirrorNode,
	pos: number,
	direction: FocusDirection
): number {
	if (direction !== 1) return pos
	const $pos = doc.resolve(pos)
	if ($pos.parent.type.name !== 'heading' || $pos.parentOffset !== 0) return pos
	return pos + headingMarkerLength($pos.parent.textContent)
}
