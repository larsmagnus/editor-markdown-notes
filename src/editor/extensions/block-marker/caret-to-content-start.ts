import { TextSelection } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

/**
 * Puts the caret at the start of what the construct's content now is, mapped
 * through the same transaction that removed its marker - the position is read
 * off the document that transaction started from.
 */
export function caretToContentStart(tr: Transaction, at: number): void {
	tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(at))))
}
