import type { InputRule } from '@tiptap/core'
import type { NodeType } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'

import { createBlockTypeInputRule } from '@/editor/extensions/block-type-input-rule'
import { parseFence } from '@/editor/extensions/code-block/code-fence'

/**
 * Converts a typed ` ```lang ` (or bare ` ``` `) into a code block whose
 * content is a real fence, language included - superseding the stock
 * `CodeBlock` extension's own backtick input rule, which only sets a
 * `language` attribute this schema no longer has. Without this the rule still
 * fires (the node becomes a `codeBlock`) but with no fence text at all:
 * nothing to syntax-highlight, and on save the block is written out unfenced.
 */
export function createFenceInputRule(type: NodeType): InputRule {
	return createBlockTypeInputRule(
		/^```([a-z]+)?[\s\n]$/,
		type,
		(tr, range, match) => {
			// A blank line between the fences, not `fenceText('', language)`
			// (which collapses to no gap, for round-tripping an already-empty
			// block byte-for-byte) - the author is about to type here.
			const text = `\`\`\`${match[1] ?? ''}\n\n\`\`\``
			tr.delete(range.from, range.to)
			tr.insertText(text, range.from)
			tr.setSelection(
				TextSelection.create(tr.doc, range.from + parseFence(text).codeFrom)
			)
		}
	)
}
