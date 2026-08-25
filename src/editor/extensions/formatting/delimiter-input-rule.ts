import { InputRule } from '@tiptap/core'
import type { MarkType } from '@tiptap/pm/model'

/**
 * Marks a typed `**bold**`/`~~strike~~` whole, delimiters included, without
 * touching the text - unlike the stock `markInputRule` these regexes were
 * built for, which deletes both delimiters and marks the bare interior,
 * leaving no visible syntax at all.
 *
 * Marking the whole span, not just the interior, matches
 * `wrap-selection-with-delimiter.ts` and `ensure-delimiters-plugin.ts`:
 * marking only the interior here left the delimiters unmarked, which the
 * safety net then read as "this run is missing its delimiters" and wrapped
 * again, doubling them up.
 *
 * The very last character(s) of `match` - whatever just completed the
 * trigger - are *not* in `state.doc` yet when this handler runs: an input
 * rule fires from `handleTextInput`, before the character it's reacting to
 * has actually been committed, and dispatching this transaction is what
 * commits it - nothing else inserts it afterward. Stock's `markInputRule`
 * never notices, because it deletes the delimiters outright and only the
 * marked interior (already fully committed) survives; this rule keeps the
 * delimiters as real text, so it has to insert whatever tail is still
 * missing itself, or the doc ends up one character short of the match it
 * just recognized - `range.to - (range.from + match[0].indexOf(outer))` is
 * exactly how much of `outer` is already there.
 *
 * `find`'s first capture group must be the whole delimited span (`**bold**`,
 * including the delimiters), and its last capture group the inner text -
 * the shape every stock `*InputRegex` already exported by `@tiptap/extension-*`
 * for these marks has.
 */
export function createDelimiterInputRule(
	markType: MarkType,
	find: RegExp,
	getAttributes?: () => Record<string, unknown>
): InputRule {
	return new InputRule({
		find,
		handler: ({ state, range, match }) => {
			const outer = match[1]
			if (!outer) return null

			const outerStart = range.from + match[0].indexOf(outer)
			const alreadyCommitted = range.to - outerStart
			const missingTail = outer.slice(alreadyCommitted)

			const tr = state.tr
			if (missingTail) tr.insertText(missingTail, range.to)

			const outerEnd = outerStart + outer.length
			// `removeStoredMark` is load-bearing, not cleanup: without it, the
			// cursor - now sitting right at the end of a freshly bold-marked run -
			// keeps typing as bold, the same way clicking to the end of existing
			// bold text does. Each further character then arrives as its own
			// one-off, disconnected bold run, which `ensure-delimiters-plugin.ts`
			// reads as "another run missing its delimiters" and wraps on the
			// spot - `**b**o**l**d**` from a single sentence typed straight
			// through. Stock's own `markInputRule` calls this for the same reason.
			tr.addMark(
				outerStart,
				outerEnd,
				markType.create(getAttributes?.())
			).removeStoredMark(markType)
		},
	})
}
