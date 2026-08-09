import type { Editor } from '@tiptap/react'
import { useEffect, useState } from 'react'

import { splitFrontmatter } from '@/lib/frontmatter'

/**
 * Keeps the note's frontmatter beside the document rather than inside it.
 *
 * markdown-it has no concept of frontmatter and would parse the `---` fence as
 * an `<hr>` followed by headings, so it is split off before `setContent` and
 * stitched back on before saving.
 */
export function useFrontmatterDocument(editor: Editor | null, content: string) {
	const [frontmatter, setFrontmatter] = useState(
		() => splitFrontmatter(content).frontmatter
	)

	useEffect(() => {
		if (!editor || content === undefined) return

		const { frontmatter: nextFrontmatter, body } = splitFrontmatter(content)

		// Compared like for like. This read `editor.getHTML() !== body`, which
		// weighed rendered HTML against markdown source - never equal, so the guard
		// never held and every incoming update re-set the document.
		if (editor.storage.markdown.getMarkdown() !== body) {
			editor.commands.setContent(body)
		}

		setFrontmatter((current) =>
			nextFrontmatter !== current ? nextFrontmatter : current
		)
	}, [content, editor])

	return { frontmatter, setFrontmatter }
}
