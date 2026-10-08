import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { BlockAlignment } from '#src/editor/extensions/markdown/block-source/align-blocks'
import { counterparts } from '#src/editor/extensions/markdown/block-source/block-counterparts'
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
 * A replaced run holding the author's work: the incoming blocks, except that
 * each of the author's changed blocks stands in for its counterpart - and one
 * without a counterpart keeps its place among them. The outside change wins
 * everywhere the author has not been writing, blank lines included.
 */
function mergeAuthorsWork(
	current: CurrentBlocks,
	incoming: ProseMirrorNode[],
	incomingTexts: string[],
	step: { current: [number, number]; incoming: [number, number] }
): PatchedBlock[] {
	const [from, to] = step.current
	const [incomingFrom, incomingTo] = step.incoming
	const authorsFor = counterparts(
		current,
		incomingTexts,
		step.current,
		step.incoming
	)
	const placed = new Set(authorsFor.values())
	const merged: PatchedBlock[] = []
	const authors = (index: number) =>
		withBlanks(current, index, { node: current.nodes[index], incoming: null })

	for (let j = incomingFrom; j < incomingTo; j++) {
		const index = authorsFor.get(j)
		if (index === undefined) {
			merged.push({ node: incoming[j], incoming: j })
			continue
		}
		merged.push(...authors(index))
	}
	for (let index = from; index < to; index++) {
		if (current.texts[index] !== null || placed.has(index)) continue
		merged.splice(Math.min(index - from, merged.length), 0, ...authors(index))
	}
	// Blank lines typed after a block the outside change replaced follow the run.
	for (let index = from; index < to; index++) {
		if (current.texts[index] === null) continue
		for (const node of current.blanksAfter[index]) {
			merged.push({ node, incoming: null })
		}
	}
	return merged
}

/** The blocks the note ends up with once every replacement that is safe to make is made. */
export function patchedBlocks(
	alignment: BlockAlignment[],
	current: CurrentBlocks,
	incoming: ProseMirrorNode[],
	incomingTexts: string[]
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
				return mergeAuthorsWork(current, incoming, incomingTexts, step)
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
