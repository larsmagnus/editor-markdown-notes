import type { InputRule } from '@tiptap/core'
import type { NodeType } from '@tiptap/pm/model'

import { createBlockTypeInputRule } from '#src/editor/extensions/block-type-input-rule'

/**
 * Converts a typed `#`x1-6 + space into a heading, superseding the stock
 * `Heading` extension's own per-level input rules (one `textblockTypeInputRule`
 * per level, each consuming its match to set a `level` attribute this schema
 * no longer has). A single rule suffices here: the level is never stored
 * separately, so the marker `heading-marker.ts` reads it back from is the same
 * text that triggered the rule.
 *
 * The trailing space is what triggered the match, so it is written back here -
 * without it the marker is incomplete and no longer parses as one.
 */
export function createHeadingInputRule(type: NodeType): InputRule {
	return createBlockTypeInputRule(/^(#{1,6}) $/, type, (tr, range) => {
		tr.insertText(' ', range.to)
	})
}
