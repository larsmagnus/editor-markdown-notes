import { Plugin, PluginKey } from '@tiptap/pm/state'

import { parseImageMarkdown } from '@/editor/extensions/image/image-markdown-text'
import {
	finalizeImageSource,
	findImageSource,
	matchesImageAttrs,
} from '@/editor/extensions/image/image-source-node'
import { revealsContainer } from '@/editor/extensions/syntax-reveal/compute-reveal-decorations'

/**
 * Keeps a revealed image source in sync with the image it belongs to, and
 * cleans it up once the caret leaves it. The counterpart to `link/`'s
 * `sync-link-attrs-plugin.ts`: this is what makes every plain arrow key and a
 * mouse click elsewhere hide the markdown and continue navigating without any
 * dedicated handling for them - the caret (or click) has already moved
 * wherever native behavior puts it by the time this runs, and this only has
 * to notice the revealed text no longer belongs there. `edit-source.ts`'s
 * `commitImageSource` covers the one exit that isn't plain navigation:
 * `Enter`.
 */
export function createImageSourcePlugin(): Plugin {
	return new Plugin({
		key: new PluginKey('imageSourceSync'),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!transactions.some((tr) => tr.docChanged || tr.selectionSet)) {
				return null
			}

			const match = findImageSource(newState.doc)
			if (!match) return null

			const stillEditing = revealsContainer(
				newState.selection,
				match.pos,
				match.pos + match.node.nodeSize
			)

			if (!stillEditing) {
				const tr = newState.tr
				finalizeImageSource(tr, match)
				return tr
			}

			if (!match.imageNode) return null
			const parsed = parseImageMarkdown(match.node.textContent)
			if (!parsed || matchesImageAttrs(match.imageNode, parsed)) return null

			return newState.tr.setNodeMarkup(match.imagePos, undefined, parsed)
		},
	})
}
