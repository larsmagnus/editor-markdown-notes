import { parseFence } from '@/editor/extensions/code-block/code-fence'
import type {
	RevealProvider,
	RevealSpan,
} from '@/editor/extensions/syntax-reveal/reveal-provider'

/**
 * Reveals a `code:true, content:'text*'` node's fence lines (the opening
 * ` ```lang ` line and, once typed, the closing ` ``` ` line) only while the
 * caret is somewhere inside the block - shared by `codeBlock` and
 * `frontmatter`, which are the same shape.
 */
export function createCodeFenceRevealProvider(
	nodeTypeNames: string[]
): RevealProvider {
	return {
		collect(doc) {
			const spans: RevealSpan[] = []

			doc.descendants((node, pos) => {
				if (!nodeTypeNames.includes(node.type.name)) return

				const text = node.textContent
				const { codeFrom, codeTo, hasClosingFence } = parseFence(text)
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
