import type { Node as ProseMirrorNode } from 'prosemirror-model'

/** A stretch of the flattened text and the document positions it came from. */
type Segment = {
	pos: number
	offset: number
	length: number
}

export type LiveTextModel = {
	/** The document's text, one line break between blocks. */
	text: string
	posToOffset: (pos: number) => number
	offsetToPos: (offset: number) => number
}

/**
 * The live document as plain text, for aligning against its markdown source.
 *
 * Every block starts a segment even when empty, so an empty paragraph still
 * has a position to land on. A leaf inline node - an image, a hard break -
 * contributes no text, which leaves its syntax for the diff to step over.
 */
export function liveTextModel(doc: ProseMirrorNode): LiveTextModel {
	const segments: Segment[] = []
	let text = ''

	doc.descendants((node, pos) => {
		if (node.isTextblock) {
			if (segments.length > 0) text += '\n'
			segments.push({ pos: pos + 1, offset: text.length, length: 0 })
			return true
		}
		if (node.isText && node.text) {
			segments.push({ pos, offset: text.length, length: node.text.length })
			text += node.text
		}
		return true
	})

	return {
		text,
		posToOffset: (pos) => {
			const segment = lastSegment(segments, (s) => s.pos <= pos)
			if (!segment) return 0

			return segment.offset + Math.min(pos - segment.pos, segment.length)
		},
		offsetToPos: (offset) => {
			const segment = lastSegment(segments, (s) => s.offset <= offset)
			if (!segment) return Math.min(1, doc.content.size)

			return segment.pos + Math.min(offset - segment.offset, segment.length)
		},
	}
}

/** The last segment satisfying `predicate`. `Array.prototype.findLast` is
 *  past the webview build's target library. */
function lastSegment(
	segments: Segment[],
	predicate: (segment: Segment) => boolean
): Segment | undefined {
	for (let index = segments.length - 1; index >= 0; index -= 1) {
		if (predicate(segments[index])) return segments[index]
	}
	return undefined
}
