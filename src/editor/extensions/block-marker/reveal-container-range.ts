import type { BlockMarkerSpec } from '#src/editor/extensions/block-marker/spec'

/**
 * How far the caret has to reach to reveal one construct's marker - the whole
 * node for a `revealScope: 'node'` spec, or just the marker's own text for a
 * `revealScope: 'marker'` one. Shared between `create-marker-reveal-
 * provider.ts`, which walks the whole document, and `use-marker-revealed.ts`,
 * which asks the same question for one node view at a time - the two must
 * never disagree about what "revealed" means.
 */
export function revealContainerRange(
	spec: Pick<BlockMarkerSpec, 'markerHost' | 'revealScope'>,
	pos: number,
	nodeSize: number,
	markerLength: number
): [number, number] {
	if (spec.revealScope === 'node') return [pos, pos + nodeSize]

	const textStart = spec.markerHost === 'self' ? pos + 1 : pos + 2
	return [textStart, textStart + markerLength]
}
