import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import {
	firstParagraphStart,
	parseListMarker,
} from '@/editor/extensions/list/list-marker'
import type {
	RevealProvider,
	RevealSpan,
} from '@/editor/extensions/syntax-reveal/reveal-provider'

/**
 * Reveals a `listItem`/`taskItem`'s leading marker only while the caret is
 * somewhere inside the item - the item as a whole is the container (not
 * just its first paragraph), so entering a wrapped second line or a nested
 * sub-list still reveals the marker above it, matching every other
 * construct's "caret anywhere inside" reveal rule.
 */
export function createListMarkerRevealProvider(
	nodeTypeNames: string[]
): RevealProvider {
	return {
		collect(doc: ProseMirrorNode) {
			const spans: RevealSpan[] = []

			doc.descendants((node, pos) => {
				if (!nodeTypeNames.includes(node.type.name)) return

				const paragraph = node.firstChild
				if (!paragraph || paragraph.type.name !== 'paragraph') return

				const parsed = parseListMarker(paragraph.textContent)
				if (!parsed) return

				const paragraphStart = firstParagraphStart(pos)
				spans.push({
					containerFrom: pos,
					containerTo: pos + node.nodeSize,
					syntaxRanges: [
						[paragraphStart, paragraphStart + parsed.markerLength],
					],
				})
			})

			return spans
		},
	}
}
