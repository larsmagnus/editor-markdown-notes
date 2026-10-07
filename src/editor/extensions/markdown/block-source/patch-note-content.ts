import type { Editor } from '@tiptap/core'

import { alignBlocks } from '#src/editor/extensions/markdown/block-source/align-blocks'
import { currentBlocks } from '#src/editor/extensions/markdown/block-source/current-blocks'
import { parseNoteDocument } from '#src/editor/extensions/markdown/block-source/parse-note-document'
import { patchedBlocks } from '#src/editor/extensions/markdown/block-source/patched-blocks'
import { patchedRegistry } from '#src/editor/extensions/markdown/block-source/patched-registry'
import { replaceChangedRuns } from '#src/editor/extensions/markdown/block-source/replace-changed-runs'
import { sourceIdOf } from '#src/editor/extensions/markdown/block-source/source-registry'
import { blocksBeforeTrailingBlanks } from '#src/editor/extensions/markdown/block-source/synced-blocks'
import { CONTENT_SYNC_META } from '#src/editor/extensions/transaction-filters'
import type { FileKind } from '#src/lib/file-kind'

/**
 * Takes an outside change to the note in block by block, leaving every block
 * whose text did not change exactly as it is - node, caret and all - and every
 * block holding edits the file has not seen yet untouched, whatever the
 * outside change did to it. The author's block wins there: their next sync
 * writes it back over the outside version, and nowhere else.
 *
 * Returns `false`, having changed nothing, when the note cannot be patched -
 * MDX, a note never loaded through the block registry, one too large to
 * align - for the caller to replace the whole document instead.
 */
export function patchNoteContent(
	editor: Editor,
	content: string,
	fileKind: FileKind
): boolean {
	const previous = editor.storage.blockSource.registry
	if (!previous || fileKind === 'mdx') return false

	const current = currentBlocks(editor)
	const { doc, registry } = parseNoteDocument(editor, content, fileKind)
	const incoming = doc.content.content.slice()
	const incomingIds = incoming.map((node) => sourceIdOf(node) ?? -1)
	const incomingTexts = incomingIds.map(
		(id) => registry.entries.get(id)?.text ?? ''
	)

	const alignment = alignBlocks(current.texts, incomingTexts)
	if (!alignment) return false

	const blocks = patchedBlocks(alignment, current, incoming)
	editor.storage.blockSource.registry = patchedRegistry(
		blocks,
		previous,
		registry,
		incomingIds
	)

	editor
		.chain()
		.setMeta(CONTENT_SYNC_META, true)
		.command(({ tr }) => {
			replaceChangedRuns(
				tr,
				blocksBeforeTrailingBlanks(editor.state.doc),
				blocks.map(({ node }) => node)
			)
			return true
		})
		.run()
	return true
}
