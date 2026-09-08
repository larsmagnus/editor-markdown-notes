import type { Schema } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import { parseListMarker } from '#src/editor/extensions/list/list-marker'
import { anyDocChanged } from '#src/editor/extensions/transaction-filters'

/**
 * Keeps a task item's `checked` attribute matching whatever its own marker
 * text currently reads - the counterpart to `toggle-task-checked-command.ts`
 * writing that text directly. Typing an `x` into a revealed `[ ]` is real
 * text editing, same as everywhere else in this app's live-preview model
 * (see `create-marker-sync-plugin.ts`'s own doc comment on why it stays
 * one-directional for this exact attribute), so without this the checkbox
 * UI - which reads `node.attrs.checked` - would go stale the moment someone
 * edited the bracket by hand instead of clicking it.
 */
export function createSyncTaskCheckedPlugin(schema: Schema): Plugin {
	return new Plugin({
		key: new PluginKey('taskCheckedSync'),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!anyDocChanged(transactions)) return null

			const { taskItem } = schema.nodes
			if (!taskItem) return null

			let tr: Transaction | undefined

			newState.doc.descendants((node, pos) => {
				if (node.type !== taskItem) return

				const paragraph = node.firstChild
				if (!paragraph || paragraph.type.name !== 'paragraph') return

				const parsed = parseListMarker(paragraph.textContent)
				if (parsed?.kind !== 'task') return
				if (parsed.checked === Boolean(node.attrs.checked)) return

				const target = tr ?? newState.tr
				target.setNodeMarkup(pos, undefined, {
					...node.attrs,
					checked: parsed.checked,
				})
				tr = target
			})

			return tr ?? null
		},
	})
}
