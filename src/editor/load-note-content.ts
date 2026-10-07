import type { Editor } from '@tiptap/core'

import { parseNoteDocument } from '#src/editor/extensions/markdown/block-source/parse-note-document'
import { CONTENT_SYNC_META } from '#src/editor/extensions/transaction-filters'
import { parseMdxDocument } from '#src/editor/parse-mdx-document'
import type { FileKind } from '#src/lib/file-kind'

type LoadNoteOptions = {
	fileKind: FileKind
	addToHistory: boolean
}

/**
 * Replaces the whole document with `content`, the way a note is loaded.
 *
 * markdown-it has no concept of frontmatter (or of MDX's own syntax) and would
 * mangle either, so `prepareParseableContent` splits that syntax out first and
 * it is restored as real nodes afterwards.
 */
export function loadNoteContent(
	editor: Editor,
	content: string,
	{ fileKind, addToHistory }: LoadNoteOptions
): void {
	const { doc, registry } =
		fileKind === 'mdx'
			? { doc: parseMdxDocument(editor, content), registry: null }
			: parseNoteDocument(editor, content, fileKind)

	editor.storage.blockSource.registry = registry
	editor.storage.blockSource.synced = new WeakMap()
	editor
		.chain()
		.setMeta('addToHistory', addToHistory)
		.setMeta(CONTENT_SYNC_META, true)
		.command(({ tr }) => {
			tr.replaceWith(0, tr.doc.content.size, doc.content)
			return true
		})
		.run()
}
