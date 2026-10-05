import { readAdmonition } from '#src/editor/extensions/admonition/admonition-of'
import type {
	RevealProvider,
	RevealSpan,
} from '#src/editor/extensions/syntax-reveal/reveal-provider'

/**
 * Hides the `[!TYPE]` text with the same caret-reveal as every other piece of
 * syntax, but as one unit with the `> ` ahead of it: the whole first line
 * reveals together, so the header stand-in never shows beside half a line of
 * raw text. The `> ` itself stays the blockquote spec's to hide.
 */
export function createAdmonitionRevealProvider(): RevealProvider {
	return {
		collect(doc) {
			const spans: RevealSpan[] = []

			doc.descendants((node, pos) => {
				const tag = readAdmonition(node)
				if (!tag) return

				const textStart = pos + 2
				spans.push({
					containerFrom: textStart,
					containerTo: textStart + tag.tagStart + tag.tagLength,
					tokens: [
						{
							role: 'marker',
							from: textStart + tag.tagStart,
							to: textStart + tag.tagStart + tag.tagLength,
						},
					],
					revealedNode: [pos, pos + node.nodeSize],
				})
			})

			return spans
		},
	}
}
