import type { Editor } from '@tiptap/react'
import { useEffect } from 'react'

import { splitFrontmatter } from '@/lib/frontmatter'

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
 */
export function useFrontmatterDocument(editor: Editor | null, content: string) {
	useEffect(() => {
		if (!editor || content === undefined) return
		if (editor.storage.markdown.getMarkdown() === content) return

		const { frontmatter, body } = splitFrontmatter(content)

		// One transaction, excluded from history: this is a content sync (initial
		// load, or an external change echoed back from the host), not a user
		// edit - left undoable, it put a phantom step ahead of the user's very
		// first keystroke, so Ctrl+Z on an untouched document cleared it.
		const chain = editor.chain().setMeta('addToHistory', false).setContent(body)
		if (frontmatter !== null) {
			chain.insertContentAt(0, {
				type: 'frontmatter',
				content: frontmatter ? [{ type: 'text', text: frontmatter }] : [],
			})
		}
		chain.run()
	}, [content, editor])
}
