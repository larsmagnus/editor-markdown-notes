import { TextSelection } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

/**
 * Inserts a fresh paragraph at `pos` and moves the caret into it - what both
 * pressing Enter inside a rule and just-created one via typing `---` need:
 * somewhere to land that isn't the rule's own one-line body. Shared so a rule
 * behaves the same way whether the author presses Enter or keeps typing.
 *
 * Reports whether it did anything, so a caller checking "can I even do this"
 * before a dispatch-less dry run gets a real answer rather than a silent
 * no-op the schema has no paragraph node to back.
 */
export function stepOutOfRule(tr: Transaction, pos: number): boolean {
	const paragraph = tr.doc.type.schema.nodes.paragraph
	if (!paragraph) return false

	tr.insert(pos, paragraph.create())
	tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)))
	return true
}
