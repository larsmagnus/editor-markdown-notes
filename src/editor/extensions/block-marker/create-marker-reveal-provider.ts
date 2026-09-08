import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { forEachMarkerHost } from '#src/editor/extensions/block-marker/marker-host'
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

				const syntaxRanges: [number, number][] = []
				if (markerLength > 0) {
					syntaxRanges.push([host.textStart, host.textStart + markerLength])
				}
				if (trailingLength > 0) {
					const textEnd = host.textStart + text.length
					syntaxRanges.push([textEnd - trailingLength, textEnd])
				}

				const wholeNode = spec.revealScope === 'node'
				spans.push({
					containerFrom: wholeNode ? pos : host.textStart,
					containerTo: wholeNode
						? pos + node.nodeSize
						: host.textStart + markerLength,
					syntaxRanges,
					revealedNode: spec.drawsMarkerStandIn
						? [pos, pos + node.nodeSize]
						: undefined,
				})
			})

			return spans
		},
	}
}
