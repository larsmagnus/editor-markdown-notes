import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { forEachMarkerHost } from '@/editor/extensions/block-marker/marker-host'
import type { BlockMarkerSpec } from '@/editor/extensions/block-marker/spec'
import type {
	RevealProvider,
	RevealSpan,
} from '@/editor/extensions/syntax-reveal/reveal-provider'

/**
 * Reveals every block construct's leading marker as the caret reaches it, each
 * spec scoping how close that has to be (see `revealScope`).
 */
export function createMarkerRevealProvider(
	specs: BlockMarkerSpec[]
): RevealProvider {
	return {
		collect(doc: ProseMirrorNode) {
			const spans: RevealSpan[] = []

			forEachMarkerHost(doc, specs, ({ spec, host, node, pos }) => {
				const markerLength = spec.length(host.node.textContent)
				if (markerLength === 0) return

				const markerEnd = host.textStart + markerLength
				const wholeNode = spec.revealScope === 'node'
				spans.push({
					containerFrom: wholeNode ? pos : host.textStart,
					containerTo: wholeNode ? pos + node.nodeSize : markerEnd,
					syntaxRanges: [[host.textStart, markerEnd]],
				})
			})

			return spans
		},
	}
}
