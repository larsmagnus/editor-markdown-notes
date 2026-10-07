import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { markdownInternals } from '#src/editor/extensions/markdown/block-source/markdown-internals'

/** One top-level block as markdown, with no newline after it. */
export function serializeBlock(editor: Editor, node: ProseMirrorNode): string {
	const { serializer } = markdownInternals(editor)
	const doc = editor.schema.topNodeType.create(null, node)
	return serializer.serialize(doc).replace(/\n+$/, '')
}
