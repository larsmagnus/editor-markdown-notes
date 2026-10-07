import type { Editor } from '@tiptap/core'
import { createDocument } from '@tiptap/core'
import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model'
import type { MarkdownIt } from 'markdown-it'

import { completeParsedDocument } from '#src/editor/complete-parsed-document'
import {
	newSourceId,
	structureOf,
	takeCapturedBlocks,
} from '#src/editor/extensions/markdown/block-source/capture-source-blocks'
import type { CapturedBlock } from '#src/editor/extensions/markdown/block-source/capture-source-blocks'
import { markdownInternals } from '#src/editor/extensions/markdown/block-source/markdown-internals'
import { hasSameStructure } from '#src/editor/extensions/markdown/block-source/same-structure'
import { serializeBlock } from '#src/editor/extensions/markdown/block-source/serialize-block'
import { buildSourceLayout } from '#src/editor/extensions/markdown/block-source/source-layout'
import type { RegisteredPiece } from '#src/editor/extensions/markdown/block-source/source-registry'

/** A block holding `text` exactly as written. */
function literalBlock(
	schema: Schema,
	id: number,
	text: string
): ProseMirrorNode {
	return schema.nodes.literalBlock.create(
		{ sourceId: id },
		text === '' ? null : schema.text(text)
	)
}

/** Whether `node` saves back as markdown that means what its source did. */
function isFaithful(
	editor: Editor,
	md: MarkdownIt,
	node: ProseMirrorNode,
	block: CapturedBlock
): boolean {
	return hasSameStructure(
		block.structure,
		structureOf(md, serializeBlock(editor, node))
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
 * that survives a save unchanged, and a literal block holding the source text
 * everywhere else - for a block the schema dropped or split, one whose
 * serialization reads back as something different, and lines markdown-it
 * rendered nothing for at all.
 */
export function parseBodyPieces(
	editor: Editor,
	body: string
): { pieces: RegisteredPiece[]; gaps: string[] } {
	const { parser } = markdownInternals(editor)
	const html = parser.parse(body)
	const captured = takeCapturedBlocks(parser.md)
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
			isFaithful(editor, parser.md, node, block)
		) {
			return { id, text, node }
		}

		const literalId = id ?? newSourceId()
		return {
			id: literalId,
			text,
			node: literalBlock(editor.schema, literalId, text),
		}
	})

	return { pieces, gaps: layout.gaps }
}
