import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model'

import { frontmatterFenceText } from '#src/editor/extensions/frontmatter/frontmatter-fence'
import { newSourceId } from '#src/editor/extensions/markdown/block-source/capture-source-blocks'
import { parseBodyPieces } from '#src/editor/extensions/markdown/block-source/parse-body-pieces'
import { buildSourceRegistry } from '#src/editor/extensions/markdown/block-source/source-registry'
import type {
	RegisteredPiece,
	SourceRegistry,
} from '#src/editor/extensions/markdown/block-source/source-registry'
import { prepareParseableContent } from '#src/hooks/prepare-parseable-content'
import type { FileKind } from '#src/lib/file-kind'

/** The frontmatter as a piece, and the exact text between it and the body. */
function frontmatterPiece(
	schema: Schema,
	content: string,
	body: string,
	frontmatter: string
): { piece: RegisteredPiece; gapAfter: string } {
	const prefix = content.slice(0, content.length - body.length)
	const text = prefix.replace(/\n*$/, '')
	const id = newSourceId()
	const node = schema.nodes.frontmatter.create(
		{ sourceId: id },
		schema.text(frontmatterFenceText(frontmatter))
	)
	return { piece: { id, text, node }, gapAfter: prefix.slice(text.length) }
}

/**
 * Parses a whole note into a document, along with the registry that lets an
 * untouched block save back byte for byte.
 *
 * MDX is out of scope: its spliced-out constructs are restored after the
 * fact (`restoreMdxBlocksInTransaction`), so its blocks cannot be lined up
 * against their source here.
 */
export function parseNoteDocument(
	editor: Editor,
	content: string,
	fileKind: Exclude<FileKind, 'mdx'>
): { doc: ProseMirrorNode; registry: SourceRegistry } {
	const { frontmatter, body } = prepareParseableContent(content, fileKind)
	const { pieces, gaps } = parseBodyPieces(editor, body)

	if (frontmatter !== null) {
		const { piece, gapAfter } = frontmatterPiece(
			editor.schema,
			content,
			body,
			frontmatter
		)
		pieces.unshift(piece)
		gaps[0] = gapAfter + gaps[0]
		gaps.unshift('')
	}

	const nodes = pieces.map((piece) => piece.node)
	const doc = editor.schema.topNodeType.create(
		null,
		nodes.length > 0 ? nodes : editor.schema.nodes.paragraph.create()
	)

	return { doc, registry: buildSourceRegistry(pieces, gaps) }
}
