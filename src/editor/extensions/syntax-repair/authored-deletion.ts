import type { Transaction } from '@tiptap/pm/state'
import { Mapping } from '@tiptap/pm/transform'

/** What an `appendTransaction` batch did to a range of the document it started from. */
export type DeletionProbe = {
	/** Was any of the old document's `[from, to)` removed by this batch? */
	deleted(from: number, to: number): boolean
	/** Where an old position now sits. */
	forward(pos: number, bias?: 1 | -1): number
}

/**
 * Lets a repair pass tell syntax the author deleted from syntax a construct
 * never had. Both reach `appendTransaction` looking identical - a list item
 * with no marker, a bold run with no `**` - and the difference decides whether
 * the pass writes the syntax back or takes the construct apart. Without it the
 * only reachable behaviour is writing it back, which is what makes markdown
 * syntax undeletable by backspacing at it.
 *
 * A range counts as deleted when what survives of it is shorter than what went
 * in, which covers a partial deletion as well as a whole one. Insertions leave
 * it longer, never shorter, so they never read as deletions.
 */
export function createDeletionProbe(
	transactions: readonly Transaction[]
): DeletionProbe {
	const mapping = new Mapping(
		transactions.flatMap((transaction) => transaction.mapping.maps)
	)

	return {
		deleted: (from, to) =>
			mapping.map(to, -1) - mapping.map(from, 1) < to - from,
		forward: (pos, bias = 1) => mapping.map(pos, bias),
	}
}
