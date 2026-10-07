import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'
import { Mapping } from '@tiptap/pm/transform'

/** Whether `[from, to)` of the batch's resulting document lies in a top-level block it changed. */
export type TouchedBlocks = (from: number, to: number) => boolean

/** Every span a batch wrote, as positions in the document it produced. */
function changedSpans(
	transactions: readonly Transaction[]
): Array<[number, number]> {
	const maps = transactions.flatMap((transaction) => transaction.mapping.maps)
	const spans: Array<[number, number]> = []

	maps.forEach((map, index) => {
		const later = new Mapping(maps.slice(index + 1))
		map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
			spans.push([later.map(newStart, -1), later.map(newEnd, 1)])
		})
	})

	return spans
}

/**
 * Whether a changed span reaches a block. A span with width overlaps it
 * properly; an empty one - where something was deleted - touches the blocks
 * on either side of it.
 */
function overlaps(
	from: number,
	to: number,
	start: number,
	end: number
): boolean {
	if (from === to) return from >= start && from <= end
	return from < end && to > start
}

/**
 * The top-level blocks of `doc` a batch changed, for a repair pass to confine
 * itself to. A pass that walks the whole document answers an edit in one
 * paragraph by rewriting syntax in another the author never touched - which
 * a note full of syntax this editor reads differently from its author turns
 * into edits appearing all over the file.
 *
 * Whole top-level blocks rather than the changed spans themselves, so a
 * repair that is about a block's shape - renumbering the rest of a list after
 * an item is inserted - still reaches all of it. A deletion touches the
 * blocks on both sides of where it happened.
 */
export function touchedTopLevelBlocks(
	transactions: readonly Transaction[],
	doc: ProseMirrorNode
): TouchedBlocks {
	const spans = changedSpans(transactions)
	const blocks: Array<[number, number]> = []

	doc.forEach((child, offset) => {
		const end = offset + child.nodeSize
		if (spans.some(([from, to]) => overlaps(from, to, offset, end))) {
			blocks.push([offset, end])
		}
	})

	return (from, to) => blocks.some(([start, end]) => from < end && to > start)
}
