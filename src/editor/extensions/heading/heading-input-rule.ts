import { InputRule } from '@tiptap/core'
import type { NodeType } from '@tiptap/pm/model'

import { canSetBlockType } from '@/editor/extensions/can-set-block-type'

/**
 * Converts a typed `#`x1-6 + space into a heading, superseding the stock
 * `Heading` extension's own per-level input rules (one `textblockTypeInputRule`
 * per level, each consuming its match to set a `level` attribute this schema
 * no longer has). A single rule suffices here: the level is never stored
 * separately, so the marker `heading-marker.ts` reads it back from is the
 * same text that triggered the rule.
 *
 * `range` covers only the already-typed `#`x1-6 - the framework intercepts
 * the trailing space that triggered the match *before* it reaches the
 * document, so the handler must insert it itself. Without this, the block
 * becomes a heading with a still-incomplete marker (no trailing space), and
 * the marker sync plugin's safety net - seeing no valid marker at
 * all - prepends a fresh one on top of it.
 */
export function createHeadingInputRule(type: NodeType): InputRule {
	return new InputRule({
		find: /^(#{1,6}) $/,
		handler: ({ state, range }) => {
			const $start = state.doc.resolve(range.from)
			if (!canSetBlockType($start, type)) return null

			state.tr
				.setBlockType(range.from, range.from, type)
				.insertText(' ', range.to)
			// Must not `return null` here - the framework reads that as "this
			// rule didn't match" and discards the transaction wholesale, steps
			// and all, even though it's already built. `null` is reserved for
			// the actual rejection above.
		},
	})
}
