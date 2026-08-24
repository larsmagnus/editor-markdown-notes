import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type {
	RevealProvider,
	RevealSpan,
} from '@/editor/extensions/syntax-reveal/reveal-provider'

/** The subset of a fence parse every fenced construct's reveal needs. */
export type FenceRange = {
	codeFrom: number
	codeTo: number
	hasClosingFence: boolean
}

/**
 * Reveals a `code:true, content:'text*'` node's fence lines (the opening
 * fence line and, once typed, the closing one) only while the caret is
 * somewhere inside the block - shared by every construct shaped this way
 * (`codeBlock`, `frontmatter`), each passing its own fence parser since the
 * marker text differs (backtick-and-language vs. a bare `---`).
 */
export function createFenceRevealProvider(
	nodeTypeNames: string[],
	parse: (text: string) => FenceRange
): RevealProvider {
	return {
		collect(doc: ProseMirrorNode) {
			const spans: RevealSpan[] = []

			doc.descendants((node, pos) => {
				if (!nodeTypeNames.includes(node.type.name)) return

				const text = node.textContent
				const { codeFrom, codeTo, hasClosingFence } = parse(text)
				const contentStart = pos + 1

				const syntaxRanges: [number, number][] = [
					[contentStart, contentStart + codeFrom],
				]
				if (hasClosingFence) {
					syntaxRanges.push([contentStart + codeTo, contentStart + text.length])
				}

				spans.push({
					containerFrom: pos,
					containerTo: pos + node.nodeSize,
					syntaxRanges,
				})
			})

			return spans
		},
	}
}
