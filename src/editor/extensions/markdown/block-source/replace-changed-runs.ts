import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'
import DiffMatchPatch, { DIFF_DELETE, DIFF_EQUAL } from 'diff-match-patch'

type Replacement = { from: number; to: number; nodes: ProseMirrorNode[] }

/** One character per distinct node, so a character diff is a diff of node identity. */
function spell(
	nodes: ProseMirrorNode[],
	codes: Map<ProseMirrorNode, string>
): string {
	return nodes
		.map((node) => {
			const code = codes.get(node) ?? String.fromCharCode(0xe000 + codes.size)
			codes.set(node, code)
			return code
		})
		.join('')
}

/**
 * Turns the top-level blocks `current` into `next` by replacing only the runs
 * that differ, leaving every node both lists share where it is - so a caret
 * in a block nobody replaced stays exactly where it was, rather than being
 * mapped to the edge of one replacement spanning the whole note.
 */
export function replaceChangedRuns(
	tr: Transaction,
	current: ProseMirrorNode[],
	next: ProseMirrorNode[]
): void {
	const codes = new Map<ProseMirrorNode, string>()
	const diffs = new DiffMatchPatch().diff_main(
		spell(current, codes),
		spell(next, codes),
		false
	)

	const replacements: Replacement[] = []
	let position = 0
	let i = 0
	let j = 0
	let pending: Replacement | null = null
	for (const [operation, text] of diffs) {
		if (operation === DIFF_EQUAL) {
			if (pending) replacements.push(pending)
			pending = null
			for (let k = 0; k < text.length; k++) position += current[i++].nodeSize
			j += text.length
			continue
		}

		pending = pending ?? { from: position, to: position, nodes: [] }
		if (operation === DIFF_DELETE) {
			for (let k = 0; k < text.length; k++) position += current[i++].nodeSize
			pending.to = position
		} else {
			pending.nodes.push(...next.slice(j, j + text.length))
			j += text.length
		}
	}
	if (pending) replacements.push(pending)

	for (const { from, to, nodes } of replacements.reverse()) {
		tr.replaceWith(from, to, nodes)
	}
}
