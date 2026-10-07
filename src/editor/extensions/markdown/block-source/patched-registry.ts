import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { sourceIdOf } from '#src/editor/extensions/markdown/block-source/source-registry'
import type {
	SourceEntry,
	SourceRegistry,
} from '#src/editor/extensions/markdown/block-source/source-registry'

/** A top-level block of a patched note, and which incoming block it now stands for - `null` for the author's own. */
export type PatchedBlock = { node: ProseMirrorNode; incoming: number | null }

/**
 * The registry for a patched note: each block that took the incoming text
 * gets its incoming entry, and each block the author has changed keeps the
 * entry it had. A gap is only carried over between blocks that were
 * neighbours in the incoming note.
 */
export function patchedRegistry(
	blocks: PatchedBlock[],
	previous: SourceRegistry,
	incoming: SourceRegistry,
	incomingIds: number[]
): SourceRegistry {
	const entries = new Map<number, SourceEntry>()
	blocks.forEach(({ node, incoming: index }, position) => {
		const id = sourceIdOf(node)
		if (id === null) return
		// Still describes the block as it was loaded, which the author's
		// version no longer matches - so it is re-serialized, and an undo back
		// to the loaded text still finds it.
		const kept = previous.entries.get(id)
		if (index === null) {
			if (kept) entries.set(id, kept)
			return
		}

		const source = incoming.entries.get(incomingIds[index])
		if (!source) return

		const next = blocks[position + 1]
		const nextIsNeighbour = next?.incoming === index + 1
		entries.set(id, {
			node,
			text: source.text,
			gapAfter: nextIsNeighbour ? source.gapAfter : '\n\n',
			nextId: next ? sourceIdOf(next.node) : null,
		})
	})

	const first = blocks.at(0)
	const last = blocks.at(-1)
	return {
		entries,
		leadingGap: first?.incoming === 0 ? incoming.leadingGap : '',
		firstId: first ? sourceIdOf(first.node) : null,
		trailingGap: incoming.trailingGap,
		lastId: last ? sourceIdOf(last.node) : null,
	}
}
