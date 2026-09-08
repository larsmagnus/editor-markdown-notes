import type { Mark, MarkType, Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { MarkRun } from '#src/editor/extensions/formatting/find-mark-runs'

/**
 * Which of `outerMarkTypeNames` uniformly cover a run's entire interior -
 * marks a newly-inserted delimiter must also carry, or nesting two delimited
 * marks (`**_text_**`) oscillates forever. ProseMirror's mark set has no
 * concept of nesting order, so `ensure-delimiters-plugin.ts` can't tell
 * "bold wraps italic" from the marks alone; a fixed outer-to-inner priority
 * (bold, then strike, then italic - see each mark's own extension) breaks
 * the tie instead. Without this, italic's plugin would insert `_` carrying
 * only italic, dropping bold; bold's plugin would then see its own run as
 * excluding that `_` (it lacks the bold mark) and wrap a second `**` just
 * inside it, and the two plugins would keep re-wrapping each other's output
 * one layer deeper, forever.
 */
export function uniformOuterMarks(
	doc: ProseMirrorNode,
	run: MarkRun,
	outerMarkTypeNames: string[]
): Mark[] {
	return outerMarkTypeNames
		.map((name) => doc.type.schema.marks[name])
		.filter((markType) => markType !== undefined)
		.map((markType) => uniformMarkAcross(doc, run, markType))
		.filter((mark) => mark !== null)
}

function uniformMarkAcross(
	doc: ProseMirrorNode,
	run: MarkRun,
	markType: MarkType
): Mark | null {
	let found: Mark | null | undefined
	let uniform = true

	doc.nodesBetween(run.from, run.to, (node) => {
		if (!uniform || !node.isText) return

		const mark = markType.isInSet(node.marks)
		if (!mark || (found && !mark.eq(found))) {
			uniform = false
			return
		}
		found = mark
	})

	return uniform ? (found ?? null) : null
}
