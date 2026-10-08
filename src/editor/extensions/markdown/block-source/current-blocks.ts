import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import {
	isBlankLine,
	sourceIdOf,
} from '#src/editor/extensions/markdown/block-source/source-registry'
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
	/** What a block the author changed held when it was loaded, to find it among the incoming ones. */
	originals: Array<string | null>
	blanksAfter: ProseMirrorNode[][]
	leadingBlanks: ProseMirrorNode[]
}

/** The note's current blocks, ready to line up against an incoming version of it. */
export function currentBlocks(editor: Editor): CurrentBlocks {
	const { registry } = editor.storage.blockSource
	const current: CurrentBlocks = {
		nodes: [],
		texts: [],
		originals: [],
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
		const id = sourceIdOf(node)
		current.originals.push(
			id === null ? null : (registry?.entries.get(id)?.text ?? null)
		)
		current.blanksAfter.push([])
	}
	return current
}
