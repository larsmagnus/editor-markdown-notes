import type { Mark, MarkType, Node as ProseMirrorNode } from '@tiptap/pm/model'

/** One contiguous run of a mark in the document. */
export type MarkRun = { from: number; to: number; mark: Mark }

/**
 * Every contiguous run of `markType` in the document, merging adjacent text
 * nodes that carry an equal mark (same attrs) into one run - the unit
 * `createDelimitedMarkRevealProvider` and the create/remove commands reason
 * about, since a run is what one pair of delimiters wraps.
 */
export function findMarkRuns(
	doc: ProseMirrorNode,
	markType: MarkType
): MarkRun[] {
	const runs: MarkRun[] = []
	let current: MarkRun | null = null

	doc.descendants((node, pos) => {
		if (!node.isText) return

		const mark = markType.isInSet(node.marks)
		if (mark && current && current.to === pos && mark.eq(current.mark)) {
			current.to = pos + node.nodeSize
			return
		}

		if (current) runs.push(current)
		current = mark ? { from: pos, to: pos + node.nodeSize, mark } : null
	})

	if (current) runs.push(current)
	return runs
}
