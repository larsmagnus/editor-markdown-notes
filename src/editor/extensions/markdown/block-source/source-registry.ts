import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/** One top-level block as the note last held it. */
export type SourceEntry = {
	node: ProseMirrorNode
	text: string
	/** The exact text between this block and `nextId`'s. */
	gapAfter: string
	nextId: number | null
}

/**
 * Every top-level block's original text, by `sourceId`, so a block nobody has
 * touched is written back exactly as it was read - malformed syntax, setext
 * headings, `*` bullets and blank-line runs included. Only a block the author
 * actually changed is re-serialized.
 */
export type SourceRegistry = {
	entries: Map<number, SourceEntry>
	leadingGap: string
	firstId: number | null
	trailingGap: string
	lastId: number | null
}

/** A top-level block, with the node it parsed to. */
export type RegisteredPiece = {
	id: number
	text: string
	node: ProseMirrorNode
}

/** The registry recording `pieces` and the gaps around them. */
export function buildSourceRegistry(
	pieces: RegisteredPiece[],
	gaps: string[]
): SourceRegistry {
	const entries: SourceRegistry['entries'] = new Map()
	pieces.forEach((piece, index) => {
		entries.set(piece.id, {
			node: piece.node,
			text: piece.text,
			gapAfter: gaps[index + 1],
			nextId: pieces[index + 1]?.id ?? null,
		})
	})

	return {
		entries,
		leadingGap: gaps[0],
		firstId: pieces[0]?.id ?? null,
		trailingGap: gaps.at(-1) ?? '',
		lastId: pieces.at(-1)?.id ?? null,
	}
}

/** The source block `node` was parsed from, if any. */
export function sourceIdOf(node: ProseMirrorNode): number | null {
	const id: unknown = node.attrs.sourceId
	return typeof id === 'number' ? id : null
}

/** The registry entry `node` still matches, if the author has not changed it since. */
export function untouchedEntry(
	registry: SourceRegistry,
	node: ProseMirrorNode
): SourceEntry | null {
	const id = sourceIdOf(node)
	if (id === null) return null

	const entry = registry.entries.get(id)
	if (!entry) return null
	// Identity first: an untouched node is the very object that was loaded.
	// `eq` catches the one an undo rebuilt with the same content.
	return entry.node === node || entry.node.eq(node) ? entry : null
}

export function isBlankLine(node: ProseMirrorNode): boolean {
	return node.type.name === 'paragraph' && node.content.size === 0
}
