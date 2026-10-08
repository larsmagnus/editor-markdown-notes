import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { structureOf } from '#src/editor/extensions/markdown/block-source/capture-source-blocks'
import type { References } from '#src/editor/extensions/markdown/block-source/capture-source-blocks'
import { markdownInternals } from '#src/editor/extensions/markdown/block-source/markdown-internals'
import { hasSameStructure } from '#src/editor/extensions/markdown/block-source/same-structure'
import {
	withEveryBracketEscaped,
	withoutEscaping,
} from '#src/editor/extensions/markdown/markdown-escaping'

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
export function serializeBlock(
	editor: Editor,
	node: ProseMirrorNode,
	references: References = editor.storage.blockSource.registry?.references ?? {}
): string {
	const { md } = markdownInternals(editor).parser
	const escaped = serialize(editor, node)
	const bare = escaped.includes('\\')
		? withoutEscaping(() => serialize(editor, node))
		: escaped
	const chosen =
		bare === escaped ||
		hasSameStructure(
			structureOf(md, escaped, references),
			structureOf(md, bare, references)
		)
			? bare
			: escaped
	if (!chosen.includes('[') || Object.keys(references).length === 0) {
		return chosen
	}

	// A bracket the escaping left bare can still meet one of the note's own
	// reference definitions, which turns `[docs]` typed as text into a link.
	return hasSameStructure(
		structureOf(md, chosen, references),
		structureOf(md, chosen)
	)
		? chosen
		: withEveryBracketEscaped(() => serialize(editor, node))
}
