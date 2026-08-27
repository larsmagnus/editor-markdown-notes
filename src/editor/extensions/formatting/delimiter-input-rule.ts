import { InputRule } from '@tiptap/core'
import type { MarkType } from '@tiptap/pm/model'

/**
 * Marks a typed `**bold**`/`~~strike~~` whole, delimiters included, without
 * touching the text - unlike the stock `markInputRule` these regexes were
 * built for, which deletes both delimiters and marks the bare interior. The
 * delimiters must carry the mark too, or `ensure-delimiters-plugin.ts` reads
 * the run as missing them and wraps it a second time.
 *
 * The character that completed the trigger is not in `state.doc` yet: an
 * input rule fires from `handleTextInput`, and dispatching this transaction
 * is what commits it. Stock never notices, deleting the delimiters anyway;
 * keeping them as real text means inserting the missing tail here.
 *
 * `find`'s first capture group must be the whole delimited span and its last
 * the inner text - the shape `@tiptap/extension-*`'s `*InputRegex` exports.
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
			// Without `removeStoredMark` the caret keeps typing as bold, and each
			// further character arrives as its own one-off run that the repair pass
			// wraps on the spot: `**b**o**l**d**` from one sentence typed through.
			tr.addMark(
				outerStart,
				outerEnd,
				markType.create(getAttributes?.())
			).removeStoredMark(markType)
		},
	})
}
