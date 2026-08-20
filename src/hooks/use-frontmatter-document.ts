import type { Editor } from '@tiptap/react'
import { useEffect } from 'react'

import { splitFrontmatter } from '@/lib/frontmatter'

/** Stable, so the default does not re-run the effect on every render. */
const neverOwnSave = () => false

/**
 * Marks the transaction below as a sync rather than an edit.
 *
 * `setContent` emits `update` like any other change, so without this the
 * auto-save cannot tell the host's own text from something the author typed,
 * and writes an external edit back as the editor's re-serialization of it -
 * escaping whatever the round-trip does not support, over a file nobody
 * touched. Read by `useMarkdownAutosave`.
 */
export const CONTENT_SYNC_META = 'contentSync'

/**
 * Rebuilds the document whenever the incoming file changes underneath it.
 *
 * Frontmatter is a real node inside the doc, so `editor.storage.markdown.
 * getMarkdown()` already reproduces the `---` fences - comparing it to the
 * whole incoming `content` is what lets this skip a rebuild when nothing
 * actually changed. markdown-it still has no concept of frontmatter and would
 * parse `---` as an `<hr>`, so a rebuild still starts with `splitFrontmatter`'s
 * regex and inserts the extracted text as a node afterward, rather than ever
 * handing `---` characters to `setContent`.
 *
 * `isOwnSave` tells an incoming change the editor caused from one it did not;
 * without it, every autosave would read as an external change.
 */
export function useFrontmatterDocument(
	editor: Editor | null,
	content: string,
	isOwnSave: (content: string) => boolean = neverOwnSave
) {
	useEffect(() => {
		if (!editor || content === undefined) return
		if (editor.storage.markdown.getMarkdown() === content) return
		// `content` catches up to the editor by way of its own autosave, and by
		// then the author has usually typed on - so the doc no longer matches
		// what it saved a second ago, and the check above no longer covers it.
		// Rebuilding there would throw away those keystrokes and the caret with
		// them, for a change the editor is the source of.
		if (isOwnSave(content)) return

		const { frontmatter, body } = splitFrontmatter(content)

		// One transaction, excluded from history: this is a content sync (initial
		// load, or an external change echoed back from the host), not a user
		// edit - left undoable, it put a phantom step ahead of the user's very
		// first keystroke, so Ctrl+Z on an untouched document cleared it.
		const chain = editor
			.chain()
			.setMeta('addToHistory', false)
			.setMeta(CONTENT_SYNC_META, true)
			.setContent(body)
		if (frontmatter !== null) {
			chain.insertContentAt(0, {
				type: 'frontmatter',
				content: frontmatter ? [{ type: 'text', text: frontmatter }] : [],
			})
		}
		chain.run()
	}, [content, editor, isOwnSave])
}
