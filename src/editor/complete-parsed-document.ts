import type { Editor } from '@tiptap/core'
import type { Fragment, Node as ProseMirrorNode } from '@tiptap/pm/model'
import { EditorState } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import { COMPLETING_PARSE_META } from '#src/editor/extensions/transaction-filters'

/**
 * `content` as the editor holds a note: with the syntax its marks carry as
 * real text written in, which the editor's own plugins add rather than the
 * parser. Run on a detached state, so the result can be inspected - and its
 * blocks lined up against their source - before it ever reaches the page.
 *
 * `prepare` adds what markdown-it never sees (frontmatter, MDX constructs) to
 * the same transaction.
 */
export function completeParsedDocument(
	editor: Editor,
	content: Fragment,
	prepare: (tr: Transaction) => void = () => {}
): ProseMirrorNode {
	const state = EditorState.create({
		schema: editor.schema,
		plugins: editor.state.plugins,
	})
	const tr = state.tr
		.replaceWith(0, state.doc.content.size, content)
		.setMeta(COMPLETING_PARSE_META, true)
	prepare(tr)
	return state.apply(tr).doc
}
