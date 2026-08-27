import type { Mark, MarkType, Node as ProseMirrorNode } from '@tiptap/pm/model'

/** One contiguous run of a mark in the document. */
export type MarkRun = { from: number; to: number; mark: Mark }

/**
 * Runs for the current document only. Every delimited mark's repair plugin,
 * reveal provider and command asks for its own runs against the same document,
 * so one edit walks it once per mark rather than once per caller. ProseMirror
 * replaces the document wholesale on every change, so the previous one is
 * never asked for again and a single generation is enough.
 *
 * The arrays escape this module, so callers must treat a run as read-only -
 * mutating one would corrupt every later reader's answer, not just its own.
 */
let cachedDoc: ProseMirrorNode | null = null
let cachedRuns = new Map<MarkType, MarkRun[]>()

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
	if (cachedDoc !== doc) {
		cachedDoc = doc
		cachedRuns = new Map()
	}

	const cached = cachedRuns.get(markType)
	if (cached) return cached

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
	cachedRuns.set(markType, runs)
	return runs
}
