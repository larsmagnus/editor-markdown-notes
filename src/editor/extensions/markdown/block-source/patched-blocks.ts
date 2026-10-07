import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { BlockAlignment } from '#src/editor/extensions/markdown/block-source/align-blocks'
import type { CurrentBlocks } from '#src/editor/extensions/markdown/block-source/current-blocks'
import type { PatchedBlock } from '#src/editor/extensions/markdown/block-source/patched-registry'

/** `node` as the author's own, followed by the blank lines they typed after it. */
function withBlanks(
	current: CurrentBlocks,
	index: number,
	block: PatchedBlock
): PatchedBlock[] {
	return [
		block,
		...current.blanksAfter[index].map((node) => ({ node, incoming: null })),
	]
}

/**
 * A replaced run holding the author's work, block for block: the author's
 * changed blocks kept, every other block taking its incoming counterpart.
 * Only possible when the two runs are the same length - otherwise the whole
 * run is kept, since nothing says which incoming block stands for the
 * author's.
 */
function mergeAuthorsWork(
	current: CurrentBlocks,
	incoming: ProseMirrorNode[],
	step: { current: [number, number]; incoming: [number, number] }
): PatchedBlock[] {
	const [from, to] = step.current
	const pairs = to - from === step.incoming[1] - step.incoming[0]

	return current.nodes.slice(from, to).flatMap((node, offset) => {
		const index = step.incoming[0] + offset
		const keep = !pairs || current.texts[from + offset] === null
		return withBlanks(
			current,
			from + offset,
			keep
				? { node, incoming: null }
				: { node: incoming[index], incoming: index }
		)
	})
}

/** The blocks the note ends up with once every replacement that is safe to make is made. */
export function patchedBlocks(
	alignment: BlockAlignment[],
	current: CurrentBlocks,
	incoming: ProseMirrorNode[]
): PatchedBlock[] {
	const leading: PatchedBlock[] = current.leadingBlanks.map((node) => ({
		node,
		incoming: null,
	}))
	return leading.concat(
		alignment.flatMap((step): PatchedBlock[] => {
			if (step.kind === 'keep') {
				const node = current.nodes[step.current]
				return withBlanks(current, step.current, {
					node,
					incoming: step.incoming,
				})
			}

			const [from, to] = step.current
			if (current.texts.slice(from, to).includes(null)) {
				return mergeAuthorsWork(current, incoming, step)
			}
			const replacements = incoming
				.slice(...step.incoming)
				.map((node, offset) => ({ node, incoming: step.incoming[0] + offset }))
			const blanks = current.blanksAfter
				.slice(from, to)
				.flat()
				.map((node) => ({ node, incoming: null }))
			return [...replacements, ...blanks]
		})
	)
}
