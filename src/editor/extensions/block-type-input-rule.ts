import { InputRule } from '@tiptap/core'
import type { Range } from '@tiptap/core'
import type { NodeType, ResolvedPos } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

import { canSetBlockType } from '#src/editor/extensions/can-set-block-type'

/**
 * An input rule that retypes a block and writes its marker text, for the
 * constructs whose syntax is real content. The stock `textblockTypeInputRule`
 * consumes its match to set an attribute, which these schemas no longer have -
 * leaving the block converted but holding no marker at all.
 *
 * `write` receives the rule's own transaction with the block already retyped,
 * and is where each construct puts its own text. Note that `range` covers only
 * what was typed *before* the character that triggered the match: the
 * framework intercepts that one before it reaches the document, so a rule
 * whose marker includes it has to write it back.
 */
export function createBlockTypeInputRule(
	find: RegExp,
	type: NodeType,
	write: (tr: Transaction, range: Range, match: RegExpMatchArray) => void,
	/**
	 * A further condition on the block the rule is about to retype. Matching is
	 * anchored to the block's start but stops at the caret, so a rule fires on
	 * text typed *in front of* content already there - fine for a heading, not
	 * for a construct that must occupy the line alone.
	 */
	accept?: ($start: ResolvedPos, range: Range) => boolean
): InputRule {
	return new InputRule({
		find,
		handler: ({ state, range, match }) => {
			const $start = state.doc.resolve(range.from)
			if (!canSetBlockType($start, type)) return null
			if (accept && !accept($start, range)) return null

			const { tr } = state
			tr.setBlockType(range.from, range.from, type)
			write(tr, range, match)
			// Must not `return null` past the guard above - the framework reads
			// that as "this rule didn't match" and discards the transaction
			// wholesale, steps and all, even though they are already built.
		},
	})
}
