import type { NodeType } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import { fenceText } from '@/editor/extensions/code-block/code-fence'

/**
 * Wraps any `codeBlock` node whose text doesn't already start with a
 * backtick in a real fence - a safety net for every way one can appear
 * without going through `fence-input-rule.ts`: the toolbar's toggle
 * command, pasting from VS Code, or any future `insertContent` call. Without
 * this, such a block looks like a normal fenced block in the editor while
 * actually holding unfenced plain text, which serializes - and round-trips
 * on the next load - as an ordinary paragraph.
 *
 * Skips a block whose text already starts with a backtick, which covers
 * both an already-fenced block and one an author is still typing their own
 * fence into character by character - re-wrapping mid-typing would fight
 * that edit instead of leaving it alone.
 *
 * Fixed in *reverse* document order when more than one block needs it in the
 * same transaction: `pos` for every block is read once, up front, from
 * `newState.doc` - replacing an earlier block first would change the fenced
 * text's length and invalidate every later block's `pos` before it's used.
 * Replacing later blocks first never has that problem, since nothing after
 * a replacement's own range shifts what comes before it.
 */
export function createEnsureFencePlugin(type: NodeType): Plugin {
	return new Plugin({
		key: new PluginKey('codeBlockEnsureFence'),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!transactions.some((transaction) => transaction.docChanged)) {
				return null
			}

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
