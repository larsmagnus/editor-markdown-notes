import type { InputRule } from '@tiptap/core'
import type { NodeType } from '@tiptap/pm/model'

import { createBlockTypeInputRule } from '#src/editor/extensions/block-type-input-rule'
import { stepOutOfRule } from '#src/editor/extensions/horizontal-rule/step-out-of-rule'

/**
 * Converts a typed `---`, `***` or `___` into a horizontal rule, keeping the
 * text as the node's content - a construct whose marker *is* its content has
 * nothing left if the rule consumes its match.
 *
 * The third character triggered the match and never reached the document, so
 * it is written back here; without it the node holds `--`, which no longer
 * reads as a rule at all.
 *
 * Declines where the block holds anything past the caret: a rule is a whole
 * line, and matching stops at the caret, so `---` typed in front of existing
 * text would otherwise swallow that text into a rule.
 *
 * Steps the caret into a new paragraph after writing the rule's own text, the
 * same place the `Enter` shortcut sends it - the rule has no room for more
 * than its own marker, so whatever the author types next needs somewhere else
 * to land. Left to ProseMirror's default mapping, that next character stays
 * put inside the rule's own text and corrupts it.
 */
export function createHorizontalRuleInputRule(type: NodeType): InputRule {
	return createBlockTypeInputRule(
		/^(-{3}|\*{3}|_{3})$/,
		type,
		(tr, range, match) => {
			const hostEnd = tr.doc.resolve(range.from).after()
			tr.insertText(match[0].slice(-1), range.to)
			stepOutOfRule(tr, tr.mapping.map(hostEnd))
		},
		($start, range) => range.to === $start.end()
	)
}
