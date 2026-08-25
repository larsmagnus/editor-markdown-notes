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
 * Reveals a `listItem`/`taskItem`'s leading marker only while the caret
 * touches the marker's own range - not the item as a whole, which can
 * include wrapped continuation lines and nested sub-lists many lines below
 * the marker. Matches how every other provider scopes tightly to the
 * construct's own span (a delimited mark to `run.from`/`run.to`; a heading
 * or code fence to the fenced node, whose whole span *is* the construct) -
 * the list item is a container node that can hold much more than its own
 * marker's line, unlike those.
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
				const markerEnd = paragraphStart + parsed.markerLength
				spans.push({
					containerFrom: paragraphStart,
					containerTo: markerEnd,
					syntaxRanges: [[paragraphStart, markerEnd]],
				})
			})

			return spans
		},
	}
}
