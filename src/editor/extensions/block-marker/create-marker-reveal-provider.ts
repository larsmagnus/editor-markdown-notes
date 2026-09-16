import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { forEachMarkerHost } from '#src/editor/extensions/block-marker/marker-host'
import { revealContainerRange } from '#src/editor/extensions/block-marker/reveal-container-range'
import type { BlockMarkerSpec } from '#src/editor/extensions/block-marker/spec'
import type {
	RevealProvider,
	RevealSpan,
} from '#src/editor/extensions/syntax-reveal/reveal-provider'

/**
 * Reveals every block construct's marker text as the caret reaches it, each
 * spec scoping how close that has to be (see `revealScope`) and contributing
 * its closing marker too, for the fenced constructs that have one.
 */
export function createMarkerRevealProvider(
	specs: BlockMarkerSpec[]
): RevealProvider {
	return {
		collect(doc: ProseMirrorNode) {
			const spans: RevealSpan[] = []

			forEachMarkerHost(doc, specs, ({ spec, host, node, pos }) => {
				const text = host.node.textContent
				const markerLength = spec.length(text)
				const trailingLength = spec.trailingLength?.(text) ?? 0
				if (markerLength === 0 && trailingLength === 0) return

				const tokens: RevealSpan['tokens'] = []
				if (markerLength > 0) {
					tokens.push({
						role: 'marker',
						from: host.textStart,
						to: host.textStart + markerLength,
					})
				}
				if (trailingLength > 0) {
					const textEnd = host.textStart + text.length
					tokens.push({
						role: 'marker',
						from: textEnd - trailingLength,
						to: textEnd,
					})
				}

				const [containerFrom, containerTo] = revealContainerRange(
					spec,
					pos,
					node.nodeSize,
					markerLength
				)
				spans.push({
					containerFrom,
					containerTo,
					tokens,
					revealedNode: [pos, pos + node.nodeSize],
				})
			})

			return spans
		},
	}
}
