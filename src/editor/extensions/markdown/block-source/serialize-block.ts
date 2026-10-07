import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { structureOf } from '#src/editor/extensions/markdown/block-source/capture-source-blocks'
import { markdownInternals } from '#src/editor/extensions/markdown/block-source/markdown-internals'
import { hasSameStructure } from '#src/editor/extensions/markdown/block-source/same-structure'
import { withoutEscaping } from '#src/editor/extensions/markdown/markdown-escaping'

/** One top-level block as markdown, with no newline after it. */
function serialize(editor: Editor, node: ProseMirrorNode): string {
	const doc = editor.schema.topNodeType.create(null, node)
	return markdownInternals(editor).serializer.serialize(doc).replace(/\n+$/, '')
}

/**
 * One top-level block as markdown, with no newline after it - and with no
 * escaping wherever none is needed: a `*` or `#` the author typed as text is
 * written as typed unless leaving it bare would read back as syntax. Decided
 * by reading both versions back, rather than by guessing per character.
 */
export function serializeBlock(editor: Editor, node: ProseMirrorNode): string {
	const escaped = serialize(editor, node)
	if (!escaped.includes('\\')) return escaped

	const bare = withoutEscaping(() => serialize(editor, node))
	const { md } = markdownInternals(editor).parser
	return hasSameStructure(structureOf(md, escaped), structureOf(md, bare))
		? bare
		: escaped
}
