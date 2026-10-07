import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { isBlankLine } from '#src/editor/extensions/markdown/block-source/source-registry'
import {
	blocksBeforeTrailingBlanks,
	fileTextOf,
} from '#src/editor/extensions/markdown/block-source/synced-blocks'

/**
 * The note's blocks to line up against the incoming ones, and the blank lines
 * the author typed after each - kept out of the alignment, since the file has
 * no block for a blank line to match, and put back after their block.
 */
export type CurrentBlocks = {
	nodes: ProseMirrorNode[]
	texts: Array<string | null>
	blanksAfter: ProseMirrorNode[][]
	leadingBlanks: ProseMirrorNode[]
}

export function currentBlocks(editor: Editor): CurrentBlocks {
	const current: CurrentBlocks = {
		nodes: [],
		texts: [],
		blanksAfter: [],
		leadingBlanks: [],
	}
	for (const node of blocksBeforeTrailingBlanks(editor.state.doc)) {
		if (isBlankLine(node)) {
			;(current.blanksAfter.at(-1) ?? current.leadingBlanks).push(node)
			continue
		}
		current.nodes.push(node)
		current.texts.push(fileTextOf(editor, node))
		current.blanksAfter.push([])
	}
	return current
}
