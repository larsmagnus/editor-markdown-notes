import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import type { MarkerMatch } from '@/editor/extensions/block-marker/marker-host'
import type { BlockMarkerSpec } from '@/editor/extensions/block-marker/spec'
import { BLOCK_MARKER_SPECS } from '@/editor/extensions/block-marker/specs'

/** Where the caret sits inside the marker of the construct enclosing it. */
export type MarkerCaret = {
	spec: BlockMarkerSpec
	nodeTypeName: string
	markerLength: number
	parentOffset: number
	/** The construct itself, for a spec that has to take it apart. */
	match: MarkerMatch
	/** Document position of the marker's first character. */
	markerStart: number
	/** The host textblock's own text, marker included. */
	text: string
}

/**
 * The caret's position relative to its enclosing construct's own marker, or
 * `null` when it isn't on a marker-bearing first line at all. The construct is
 * the caret's own textblock for a spec that hosts its marker itself, and its
 * parent for one whose marker lives in a child paragraph.
 */
function resolveMarkerCaret(editor: Editor): MarkerCaret | null {
	const { selection } = editor.state
	if (!(selection instanceof TextSelection) || !selection.empty) return null

	const { $from } = selection
	if ($from.depth < 1) return null

	const spec = BLOCK_MARKER_SPECS.find((candidate) =>
		candidate.nodeTypes.includes(
			$from.node(
				candidate.markerHost === 'self' ? $from.depth : $from.depth - 1
			).type.name
		)
	)
	if (!spec) return null

	const nodeDepth = spec.markerHost === 'self' ? $from.depth : $from.depth - 1
	if (nodeDepth < 1) return null

	// Keeps this in step with `resolveMarkerHost`, which resolves the same
	// construct's marker line the same way: the marker text is read off
	// whatever textblock the caret is in, so that textblock must be the one the
	// spec actually keeps its marker in. Nothing reaches it today - a heading or
	// code block inside a blockquote is claimed by its own spec first - but the
	// two must not be able to disagree about where a marker lives.
	if (
		spec.markerHost === 'firstParagraph' &&
		($from.index(nodeDepth) !== 0 || $from.parent.type.name !== 'paragraph')
	) {
		return null
	}

	const text = $from.parent.textContent
	const markerLength = spec.length(text)
	if (markerLength === 0) return null

	const node = $from.node(nodeDepth)
	const pos = $from.before(nodeDepth)
	return {
		spec,
		nodeTypeName: node.type.name,
		markerLength,
		parentOffset: $from.parentOffset,
		match: {
			spec,
			node,
			pos,
			parent: nodeDepth > 0 ? $from.node(nodeDepth - 1) : null,
			index: $from.index(nodeDepth - 1),
			host: {
				node: $from.parent,
				nodeStart: $from.before(),
				textStart: $from.start(),
			},
		},
		markerStart: $from.start(),
		text,
	}
}

/**
 * The caret sits right after the marker. That is the construct's real content
 * start - offset 0 sits *before* the marker, where acting on the construct as
 * a whole would instead edit its syntax. Used by `tab-indent-extension.ts` to
 * nest and un-nest list items.
 */
export function markerCaretAtBoundary(editor: Editor): MarkerCaret | null {
	const caret = resolveMarkerCaret(editor)
	if (!caret || caret.parentOffset !== caret.markerLength) return null
	return caret
}

/**
 * The caret is somewhere within the marker, so Backspace deletes marker text.
 * The whole marker is the unit, not the character under the caret: a
 * half-deleted marker fails its spec's parse, and repair cannot tell that
 * remnant from a construct that never had a marker.
 */
export function markerCaretInMarker(editor: Editor): MarkerCaret | null {
	const caret = resolveMarkerCaret(editor)
	if (!caret?.spec.backspaceRemovesMarker) return null
	if (caret.parentOffset === 0) return null
	if (caret.parentOffset > caret.markerLength) return null
	return caret
}

/**
 * The caret is one position past the marker, about to backspace the very first
 * content character. Native contenteditable deletion at that exact boundary
 * can reach across the marker's hidden span and take part of the marker with
 * it, which the repair pass then reads as a marker the author removed.
 */
export function markerCaretAtFirstContentChar(editor: Editor): boolean {
	const caret = resolveMarkerCaret(editor)
	return caret !== null && caret.parentOffset === caret.markerLength + 1
}
