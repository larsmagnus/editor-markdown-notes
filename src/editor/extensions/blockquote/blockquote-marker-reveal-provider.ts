import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import {
	blockquoteMarkerLength,
	firstParagraphStart,
} from '@/editor/extensions/blockquote/blockquote-marker'
import type {
	RevealProvider,
	RevealSpan,
} from '@/editor/extensions/syntax-reveal/reveal-provider'

/**
 * Reveals a blockquote's leading `"> "` only while the caret touches the
 * marker's own range - not the quote as a whole, which can hold many more
 * lines below it. Mirrors `list-marker-reveal-provider.ts`'s own fix for the
 * same over-eager-reveal bug, applied here from the start per that fix's
 * lesson rather than rediscovered by a bug report.
 */
export function createBlockquoteMarkerRevealProvider(
	nodeTypeName: string
): RevealProvider {
	return {
		collect(doc: ProseMirrorNode) {
			const spans: RevealSpan[] = []

			doc.descendants((node, pos) => {
				if (node.type.name !== nodeTypeName) return

				const paragraph = node.firstChild
				if (!paragraph || paragraph.type.name !== 'paragraph') return

				const markerLength = blockquoteMarkerLength(paragraph.textContent)
				if (markerLength === 0) return

				const paragraphStart = firstParagraphStart(pos)
				const markerEnd = paragraphStart + markerLength
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
