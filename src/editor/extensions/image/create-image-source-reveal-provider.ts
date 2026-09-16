import { imageMarkdownTokens } from '#src/editor/extensions/image/image-markdown-text'
import { findImageSource } from '#src/editor/extensions/image/image-source-node'
import type { RevealProvider } from '#src/editor/extensions/syntax-reveal/reveal-provider'

/**
 * Tags the one `imageSource` node's own markdown, while it exists, with the
 * same `data-token`/`construct-revealed` vocabulary every other construct's
 * revealed syntax carries - it has no collapsed state of its own (unlike
 * everything else `SyntaxReveal` decorates, it is inserted already revealed
 * and removed on exit), so `containerFrom`/`containerTo` span the whole
 * document rather than the node, keeping it in the "revealed" bucket
 * regardless of where the selection currently sits.
 */
export function createImageSourceRevealProvider(): RevealProvider {
	return {
		collect(doc) {
			const match = findImageSource(doc)
			if (!match) return []

			const textStart = match.pos + 1
			const tokens = imageMarkdownTokens(match.node.textContent).map(
				({ role, from, to }) => ({
					role,
					from: textStart + from,
					to: textStart + to,
				})
			)

			return [
				{
					containerFrom: 0,
					containerTo: doc.content.size,
					tokens,
					revealedNode: [match.pos, match.pos + match.node.nodeSize],
				},
			]
		},
	}
}
