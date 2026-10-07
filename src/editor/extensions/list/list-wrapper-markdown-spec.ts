import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import { parseListMarker } from '#src/editor/extensions/list/list-marker'

/** The marker an item's first line carries, as the wrapping list must write it. */
type WrittenMarker = (item: ProseMirrorNode, index: number) => string

/**
 * Writes a list with each item's marker as the item itself carries it - `*`
 * and `+` bullets, `3)` numbers - rather than a stock `-` or `1.`, so what an
 * edited list saves as is what it showed. Continuation lines are indented
 * past the widest marker, which keeps them inside their item.
 */
function renderWithWrittenMarkers(
	state: MarkdownSerializerState,
	node: ProseMirrorNode,
	written: WrittenMarker
): void {
	const markers: string[] = []
	node.forEach((item, _offset, index) => markers.push(written(item, index)))
	const width = Math.max(2, ...markers.map((marker) => marker.length))
	state.renderList(node, ' '.repeat(width), (index) => markers[index])
}

/** A bullet list's own serialize - task lists' too, whose items write their checkbox after it. */
export function bulletListMarkdownSerialize(
	state: MarkdownSerializerState,
	node: ProseMirrorNode
): void {
	renderWithWrittenMarkers(state, node, (item) => {
		const parsed = parseListMarker(item.firstChild?.textContent ?? '')
		const bullet =
			parsed?.kind === 'bullet' || parsed?.kind === 'task'
				? parsed.bulletChar
				: '-'
		return `${bullet} `
	})
}

/** An ordered list's own serialize, numbering an item without a marker of its own from the list's start. */
export function orderedListMarkdownSerialize(
	state: MarkdownSerializerState,
	node: ProseMirrorNode
): void {
	const start = Number(node.attrs.start ?? 1)
	renderWithWrittenMarkers(state, node, (item, index) => {
		const text = item.firstChild?.textContent ?? ''
		const parsed = parseListMarker(text)
		if (parsed?.kind !== 'ordered') return `${start + index}. `
		return `${text.slice(0, parsed.markerLength).trimEnd()} `
	})
}
