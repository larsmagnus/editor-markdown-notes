import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorState, Transaction } from '@tiptap/pm/state'

import { detectFrontmatter } from '#src/editor/extensions/frontmatter/detect'
import { createDeletionProbe } from '#src/editor/extensions/syntax-repair/authored-deletion'
import {
	anyDocChanged,
	isAuthorEdit,
} from '#src/editor/extensions/transaction-filters'

/** Whether a position of the new document held a horizontal rule before this batch. */
function rulesBefore(
	transactions: readonly Transaction[],
	oldState: EditorState
): (pos: number) => boolean {
	const probe = createDeletionProbe(transactions)
	const rules = new Set<number>()
	oldState.doc.forEach((child, offset) => {
		if (child.type.name === 'horizontalRule')
			rules.add(probe.forward(offset, 1))
	})
	return (pos) => rules.has(pos)
}

/** Runs `detectFrontmatter` after every edit of the author's. */
export function createDetectFrontmatterPlugin(): Plugin {
	return new Plugin({
		key: new PluginKey('frontmatterDetect'),
		appendTransaction: (transactions, oldState, newState) =>
			anyDocChanged(transactions) && isAuthorEdit(transactions)
				? (detectFrontmatter(newState, rulesBefore(transactions, oldState)) ??
					undefined)
				: undefined,
	})
}
