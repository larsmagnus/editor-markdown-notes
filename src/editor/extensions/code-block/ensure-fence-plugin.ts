import type { NodeType } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import { fenceText } from '@/editor/extensions/code-block/code-fence'
import { anyDocChanged } from '@/editor/extensions/transaction-filters'

/**
 * Wraps any `codeBlock` whose text does not start with a backtick in a real
 * fence - the safety net for every way one appears without going through the
 * input rule. Unfenced, such a block looks normal in the editor while
 * serializing, and round-tripping back, as an ordinary paragraph.
 *
 * A leading backtick is enough to skip: that covers an already-fenced block
 * and one whose fence is still being typed character by character, which
 * re-wrapping would fight.
 *
 * Blocks are fixed in reverse document order, so every position - all read
 * once, up front - stays valid.
 */
export function createEnsureFencePlugin(type: NodeType): Plugin {
	return new Plugin({
		key: new PluginKey('codeBlockEnsureFence'),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!anyDocChanged(transactions)) return null

			const unfenced: {
				pos: number
				node: { nodeSize: number; text: string }
			}[] = []
			newState.doc.descendants((node, pos) => {
				if (node.type !== type) return
				const text = node.textContent
				if (text.startsWith('`')) return
				unfenced.push({ pos, node: { nodeSize: node.nodeSize, text } })
			})

			let tr: Transaction | undefined
			for (const { pos, node } of unfenced.reverse()) {
				const target = tr ?? newState.tr
				target.replaceWith(
					pos + 1,
					pos + node.nodeSize - 1,
					newState.schema.text(fenceText(node.text, ''))
				)
				tr = target
			}
			return tr
		},
	})
}
