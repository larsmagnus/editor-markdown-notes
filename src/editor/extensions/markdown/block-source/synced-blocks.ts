import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { writeNote } from '#src/editor/extensions/markdown/block-source/serialize-note'
import {
	isBlankLine,
	untouchedEntry,
} from '#src/editor/extensions/markdown/block-source/source-registry'

/**
 * Remembers what each top-level block was written to the file as, once
 * `synced` - the text a sync just sent - is exactly what the note serializes
 * to now. A block the author changed and then synced is the file's text
 * again: an outside change may replace it like any other. Skipped when the
 * note has already moved on, leaving those blocks the author's.
 */
export function recordSyncedNote(editor: Editor, synced: string): void {
	const { registry, synced: written } = editor.storage.blockSource
	if (!registry) return

	const { markdown, blocks } = writeNote(editor, registry)
	if (markdown !== synced) return
	for (const { node, text } of blocks) written.set(node, text)
}

/**
 * What the file holds for `node`, as far as this editor knows - its source
 * text if untouched since loading, what it was last synced as otherwise - or
 * `null` for a block holding edits of the author's the file has not seen.
 */
export function fileTextOf(
	editor: Editor,
	node: ProseMirrorNode
): string | null {
	const { registry, synced } = editor.storage.blockSource
	const entry = registry ? untouchedEntry(registry, node) : null
	return entry?.text ?? synced.get(node) ?? null
}

/** The top-level blocks, without the empty paragraphs trailing the note. */
export function blocksBeforeTrailingBlanks(
	doc: ProseMirrorNode
): ProseMirrorNode[] {
	const blocks = doc.content.content.slice()
	while (blocks.length > 0 && isBlankLine(blocks[blocks.length - 1]))
		blocks.pop()
	return blocks
}

/** Whether the note holds anything of the author's the file has not seen. */
export function hasUnsyncedChanges(editor: Editor): boolean {
	return blocksBeforeTrailingBlanks(editor.state.doc).some(
		(node) => fileTextOf(editor, node) === null
	)
}
