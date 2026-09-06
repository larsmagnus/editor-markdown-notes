import type { Transaction } from '@tiptap/pm/state'

/**
 * Whether any of an `appendTransaction` batch actually changed the document -
 * the guard every repair plugin opens with, so a bare selection change does
 * not send it walking the whole document.
 */
export function anyDocChanged(transactions: readonly Transaction[]): boolean {
	return transactions.some((transaction) => transaction.docChanged)
}

/**
 * What a batch carries under `key`, the way a command names its intent to the
 * plugin that answers it - `undefined` when no transaction set one.
 */
export function metaString(
	transactions: readonly Transaction[],
	key: string
): string | undefined {
	for (const transaction of transactions) {
		const value: unknown = transaction.getMeta(key)
		if (typeof value === 'string') return value
	}
	return undefined
}
