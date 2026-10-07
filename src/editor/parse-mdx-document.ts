import type { Editor } from '@tiptap/core'
import { createDocument } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { completeParsedDocument } from '#src/editor/complete-parsed-document'
import { frontmatterFenceText } from '#src/editor/extensions/frontmatter/frontmatter-fence'
import { markdownInternals } from '#src/editor/extensions/markdown/block-source/markdown-internals'
import { restoreMdxBlocksInTransaction } from '#src/editor/extensions/mdx-block/restore-mdx-blocks'
import { prepareParseableContent } from '#src/hooks/prepare-parseable-content'

/**
 * An MDX note as a document. Its spliced-out constructs are restored after
 * parsing, so its blocks cannot be lined up against their source, and it saves
 * by re-serializing the whole note.
 */
export function parseMdxDocument(
	editor: Editor,
	content: string
): ProseMirrorNode {
	const { frontmatter, body, mdxBlocks } = prepareParseableContent(
		content,
		'mdx'
	)
	const parsed = createDocument(
		markdownInternals(editor).parser.parse(body),
		editor.schema
	)

	return completeParsedDocument(editor, parsed.content, (tr) => {
		if (frontmatter !== null) {
			tr.insert(
				0,
				editor.schema.nodes.frontmatter.create(
					null,
					editor.schema.text(frontmatterFenceText(frontmatter))
				)
			)
		}
		restoreMdxBlocksInTransaction(tr, editor.schema, mdxBlocks)
	})
}
