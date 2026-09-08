import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { BlockMarkerSpec } from '#src/editor/extensions/block-marker/spec'

/** The textblock a construct's marker text actually lives in. */
type MarkerHost = {
	node: ProseMirrorNode
	/** Position of the host node itself, for replacing it wholesale. */
	nodeStart: number
	/** Position of the host's own text, where the marker begins. */
	textStart: number
}

/**
 * The textblock holding `node`'s marker, or `null` when the construct has no
 * such line: a blockquote whose first child is another blockquote, or a list
 * item whose first child is a nested list, carry no marker text of their own
 * and every enclosing level keeps synthesizing its marker at save time.
 */
function resolveMarkerHost(
	spec: BlockMarkerSpec,
	node: ProseMirrorNode,
	pos: number
): MarkerHost | null {
	if (spec.markerHost === 'self') {
		return { node, nodeStart: pos, textStart: pos + 1 }
	}

	const paragraph = node.firstChild
	if (!paragraph || paragraph.type.name !== 'paragraph') return null
	return { node: paragraph, nodeStart: pos + 1, textStart: pos + 2 }
}

/** One marker-bearing construct found in the document. */
export type MarkerMatch = {
	spec: BlockMarkerSpec
	host: MarkerHost
	node: ProseMirrorNode
	pos: number
	parent: ProseMirrorNode | null
	index: number
}

/**
 * Visits every construct in `doc` that any spec claims and that carries a
 * marker line, in document order.
 */
export function forEachMarkerHost(
	doc: ProseMirrorNode,
	specs: BlockMarkerSpec[],
	visit: (match: MarkerMatch) => void
): void {
	doc.descendants((node, pos, parent, index) => {
		const spec = specs.find((candidate) =>
			candidate.nodeTypes.includes(node.type.name)
		)
		if (!spec) return

		const host = resolveMarkerHost(spec, node, pos)
		if (host) visit({ spec, host, node, pos, parent, index })
	})
}
