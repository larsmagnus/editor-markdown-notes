import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import type { BlockMarkerSpec } from '@/editor/extensions/block-marker/spec'
import { BLOCK_MARKER_SPECS } from '@/editor/extensions/block-marker/specs'

/** Where the caret sits inside the marker of the construct enclosing it. */
export type MarkerCaret = {
	spec: BlockMarkerSpec
	nodeTypeName: string
	markerLength: number
	parentOffset: number
}

/**
 * The caret's position relative to its enclosing construct's own marker, or
 * `null` when it isn't on a marker-bearing first line at all. Only constructs
 * whose marker lives in a child paragraph can be resolved this way - the caret
 * is one depth inside them, which is what makes the enclosing node findable.
 */
function resolveMarkerCaret(editor: Editor): MarkerCaret | null {
	const { selection } = editor.state
	if (!(selection instanceof TextSelection) || !selection.empty) return null

	const { $from } = selection
	if ($from.depth < 1) return null

	const nodeDepth = $from.depth - 1
	const node = $from.node(nodeDepth)
	const spec = BLOCK_MARKER_SPECS.find(
		(candidate) =>
			candidate.markerHost === 'firstParagraph' &&
			candidate.nodeTypes.includes(node.type.name)
	)
	if (!spec) return null
	if ($from.index(nodeDepth) !== 0) return null

	const markerLength = spec.length($from.parent.textContent)
	if (markerLength === 0) return null

	return {
		spec,
		nodeTypeName: node.type.name,
		markerLength,
		parentOffset: $from.parentOffset,
	}
}

/**
 * The caret sits right after the marker. That is the construct's real content
 * start - offset 0 sits *before* the marker, where acting on the construct as
 * a whole would instead edit its syntax. Shared by `tab-indent-extension.ts`
 * (nest/un-nest) and the Backspace handling that exits a construct.
 */
export function markerCaretAtBoundary(editor: Editor): MarkerCaret | null {
	const caret = resolveMarkerCaret(editor)
	if (!caret || caret.parentOffset !== caret.markerLength) return null
	return caret
}

/**
 * The caret is one position past the marker, about to backspace the very first
 * content character. Native contenteditable deletion at that exact boundary
 * can reach across the marker's hidden span and take part of the marker with
 * it, which the sync plugin then reads as an absent marker and replaces with a
 * second one beside the remnant.
 */
export function markerCaretAtFirstContentChar(editor: Editor): boolean {
	const caret = resolveMarkerCaret(editor)
	return caret !== null && caret.parentOffset === caret.markerLength + 1
}
