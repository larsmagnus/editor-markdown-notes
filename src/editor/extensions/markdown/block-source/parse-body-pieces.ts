import type { Editor } from '@tiptap/core'
import { createDocument } from '@tiptap/core'
import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model'
import type { MarkdownIt } from 'markdown-it'

import { completeParsedDocument } from '#src/editor/complete-parsed-document'
import {
	capturedReferencesOf,
	newSourceId,
	structureOf,
	takeCapturedBlocks,
} from '#src/editor/extensions/markdown/block-source/capture-source-blocks'
import type {
	CapturedBlock,
	References,
} from '#src/editor/extensions/markdown/block-source/capture-source-blocks'
import { markdownInternals } from '#src/editor/extensions/markdown/block-source/markdown-internals'
import { hasSameStructure } from '#src/editor/extensions/markdown/block-source/same-structure'
import { serializeBlock } from '#src/editor/extensions/markdown/block-source/serialize-block'
import { buildSourceLayout } from '#src/editor/extensions/markdown/block-source/source-layout'
import type { RegisteredPiece } from '#src/editor/extensions/markdown/block-source/source-registry'

/**
 * A block holding `text` exactly as written: an HTML block for what
 * markdown-it read as one, a literal block for anything else.
 */
function verbatimBlock(
	schema: Schema,
	id: number,
	text: string,
	type: string | undefined
): ProseMirrorNode {
	const nodeType =
		type === 'html_block' ? schema.nodes.htmlBlock : schema.nodes.literalBlock
	return nodeType.create(
		{ sourceId: id },
		text === '' ? null : schema.text(text)
	)
}

/** Whether `node` saves back as markdown that means what its source did. */
function isFaithful(
	editor: Editor,
	md: MarkdownIt,
	node: ProseMirrorNode,
	block: CapturedBlock,
	references: References
): boolean {
	return hasSameStructure(
		block.structure,
		structureOf(md, serializeBlock(editor, node, references), references)
	)
}

/** Each parsed top-level node by the source block it came from. */
function nodesBySourceId(doc: ProseMirrorNode): Map<number, ProseMirrorNode[]> {
	const nodes = new Map<number, ProseMirrorNode[]>()
	doc.forEach((child) => {
		const id: unknown = child.attrs.sourceId
		if (typeof id !== 'number') return
		nodes.set(id, [...(nodes.get(id) ?? []), child])
	})
	return nodes
}

/**
 * The body's blocks as nodes, in source order: what markdown-it parsed where
 * that survives a save unchanged, and the source text held verbatim
 * everywhere else - for a block the schema dropped or split, one whose
 * serialization reads back as something different, and lines markdown-it
 * rendered nothing for at all.
 */
export function parseBodyPieces(
	editor: Editor,
	body: string
): { pieces: RegisteredPiece[]; gaps: string[]; references: References } {
	const { parser } = markdownInternals(editor)
	const html = parser.parse(body)
	const captured = takeCapturedBlocks(parser.md)
	const references = capturedReferencesOf(parser.md)
	const parsed = nodesBySourceId(
		completeParsedDocument(editor, createDocument(html, editor.schema).content)
	)
	const layout = buildSourceLayout(body, captured)
	const capturedById = new Map(captured.map((block) => [block.id, block]))

	const pieces = layout.pieces.map(({ id, text }): RegisteredPiece => {
		const block = id === null ? undefined : capturedById.get(id)
		const nodes = id === null ? undefined : parsed.get(id)
		const node = nodes?.length === 1 ? nodes[0] : undefined
		if (
			id !== null &&
			block &&
			node &&
			isFaithful(editor, parser.md, node, block, references)
		) {
			return { id, text, node }
		}

		const literalId = id ?? newSourceId()
		return {
			id: literalId,
			text,
			node: verbatimBlock(editor.schema, literalId, text, block?.type),
		}
	})

	return { pieces, gaps: layout.gaps, references }
}
