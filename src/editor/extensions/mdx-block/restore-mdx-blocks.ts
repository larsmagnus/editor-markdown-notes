import type { Schema } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

import { mdxPlaceholderIndex } from '#src/editor/extensions/mdx-block/splice-mdx-placeholders'

/**
 * Replaces every placeholder paragraph `spliceMdxPlaceholders` left behind
 * with a real `mdxBlock` node holding the original raw text, in the same
 * transaction `setContent` and the frontmatter insertion already ran in - so
 * the whole rebuild lands as one undo step, matching how frontmatter's own
 * insertion already behaves.
 *
 * Walks `tr.doc` (not the editor's own state) since this runs chained after
 * earlier steps in the same transaction, and mutates positions found later
 * first - replacing one earlier in the document would shift every position
 * found after it.
 */
export function restoreMdxBlocksInTransaction(
	tr: Transaction,
	schema: Schema,
	blocks: string[]
): void {
	if (blocks.length === 0) return

	const mdxBlockType = schema.nodes.mdxBlock
	if (!mdxBlockType) return

	const replacements: { pos: number; size: number; raw: string }[] = []

	tr.doc.descendants((node, pos) => {
		if (node.type.name !== 'paragraph') return
		const index = mdxPlaceholderIndex(node.textContent)
		if (index === null) return
		const raw = blocks[index]
		if (raw === undefined) return

		replacements.push({ pos, size: node.nodeSize, raw })
	})

	for (const { pos, size, raw } of replacements.reverse()) {
		tr.replaceWith(pos, pos + size, mdxBlockType.create(null, schema.text(raw)))
	}
}
