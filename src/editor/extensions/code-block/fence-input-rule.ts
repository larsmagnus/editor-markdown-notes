import { InputRule } from '@tiptap/core'
import type { NodeType } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'

import { parseFence } from '@/editor/extensions/code-block/code-fence'

/**
 * Converts a typed ` ```lang ` (or bare ` ``` `) into a code block whose
 * content is a real fence, language included - superseding the stock
 * `CodeBlock` extension's own backtick input rule, which only sets a
 * `language` attribute this schema no longer has. Without this, the rule
 * still fires (the node becomes a `codeBlock`) but with no fence text at
 * all: nothing to syntax-highlight, and on save `state.text(node.textContent)`
 * writes the block out as unfenced plain text.
 */
export function createFenceInputRule(type: NodeType): InputRule {
	return new InputRule({
		find: /^```([a-z]+)?[\s\n]$/,
		handler: ({ state, range, match }) => {
			const $start = state.doc.resolve(range.from)
			if (
				!$start
					.node(-1)
					.canReplaceWith($start.index(-1), $start.indexAfter(-1), type)
			) {
				return null
			}

			const language = match[1] ?? ''
			// A blank line between the fences, not `fenceText('', language)`
			// (which collapses to no gap, for round-tripping an already-empty
			// block byte-for-byte) - the author is about to type here.
			const text = `\`\`\`${language}\n\n\`\`\``
			const { tr } = state
			tr.delete(range.from, range.to)
				.setBlockType(range.from, range.from, type)
				.insertText(text, range.from)
			tr.setSelection(
				TextSelection.create(tr.doc, range.from + parseFence(text).codeFrom)
			)
			// Must not `return null` here - the framework reads that as "this
			// rule didn't match" and discards the transaction wholesale, steps
			// and all, even though they're already built. `null` is reserved for
			// the actual rejection above.
		},
	})
}
