import type { NodeType } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import {
	headingMarkerLength,
	headingMarkerText,
} from '@/editor/extensions/heading/heading-marker'

/**
 * Gives any `heading` node missing its literal marker text a level-1 one - a
 * safety net for every way one can appear without going through
 * `heading-input-rule.ts` or the toggle/set commands: `insertContent`,
 * paste, or a future command this file doesn't know about yet. Without this,
 * such a heading looks like an ordinary heading in the editor while holding
 * no marker text at all, which serializes - and round-trips on the next
 * load - as a plain paragraph.
 *
 * Fixed in *reverse* document order, the same reason `ensure-fence-plugin.ts`
 * is: inserting text at a later heading's start never shifts an earlier
 * heading's already-read position.
 */
export function createEnsureHeadingMarkerPlugin(type: NodeType): Plugin {
	return new Plugin({
		key: new PluginKey('headingEnsureMarker'),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!transactions.some((transaction) => transaction.docChanged)) {
				return null
			}

			const unmarked: { pos: number }[] = []
			newState.doc.descendants((node, pos) => {
				if (node.type !== type) return
				if (headingMarkerLength(node.textContent) > 0) return
				unmarked.push({ pos })
			})
			if (unmarked.length === 0) return null

			let tr: Transaction | undefined
			for (const { pos } of unmarked.reverse()) {
				const target = tr ?? newState.tr
				target.insertText(headingMarkerText(1), pos + 1)
				tr = target
			}
			return tr
		},
	})
}
