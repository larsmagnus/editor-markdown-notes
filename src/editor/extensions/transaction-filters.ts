import type { Transaction } from '@tiptap/pm/state'

/**
 * Whether any of an `appendTransaction` batch actually changed the document -
 * the guard every repair plugin opens with, so a bare selection change does
 * not send it walking the whole document.
 */
export function anyDocChanged(transactions: readonly Transaction[]): boolean {
	return transactions.some((transaction) => transaction.docChanged)
}

/** Whether any of a batch carries `key`, the way a command signals its intent. */
export function anyMeta(
	transactions: readonly Transaction[],
	key: string
): boolean {
	return transactions.some((transaction) => transaction.getMeta(key))
}
