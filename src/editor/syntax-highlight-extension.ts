import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Extension } from '@tiptap/react'

/**
 * Draws Shiki's token colors onto fenced code blocks.
 *
 * Deliberately dumb, the same way `TextTools` is: `useSyntaxHighlight` owns the
 * tokenizing pipeline and hands down finished, already positioned ranges. The
 * decorations sit directly on ProseMirror's own editable text - not a rendered
 * overlay - which is what lets typing, the caret and selection keep working
 * exactly as they do in a plain, unhighlighted block; only the color changes.
 *
 * Registered unconditionally, like `TextTools`: `useEditor` builds the editor
 * once with no dependency array, so a conditional extension list would tear
 * the whole editor down. This one has no toggle to begin with.
 */

/** One Shiki token, positioned to a document range. */
export type PlacedToken = {
	from: number
	to: number
	color: string
	/** Shiki's TextMate `FontStyle` bitmask: 1 italic, 2 bold, 4 underline, 8
	 *  strikethrough. Its `NotSet` is `-1`, which has every one of those bits
	 *  set, so it has to be filtered out rather than masked. */
	fontStyle?: number
}

const syntaxHighlightPluginKey = new PluginKey<DecorationSet>('syntaxHighlight')

function styleFor(token: PlacedToken): string {
	let style = `color:${token.color}`
	if (!token.fontStyle || token.fontStyle < 0) return style

	if (token.fontStyle & 1) style += ';font-style:italic'
	if (token.fontStyle & 2) style += ';font-weight:bold'
	if (token.fontStyle & 4) style += ';text-decoration:underline'
	if (token.fontStyle & 8) style += ';text-decoration:line-through'

	return style
}

function toDecorations(
	doc: Parameters<typeof DecorationSet.create>[0],
	tokens: PlacedToken[]
): DecorationSet {
	const decorations = tokens.flatMap((token) => {
		// A stale range would throw inside `Decoration.inline`.
		if (token.from >= token.to || token.to > doc.content.size) return []

		return Decoration.inline(token.from, token.to, { style: styleFor(token) })
	})

	return DecorationSet.create(doc, decorations)
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		syntaxHighlight: {
			setSyntaxHighlightRanges: (tokens: PlacedToken[]) => ReturnType
		}
	}
}

export const SyntaxHighlight = Extension.create({
	name: 'syntaxHighlight',

	addCommands() {
		return {
			setSyntaxHighlightRanges:
				(tokens: PlacedToken[]) =>
				({ tr, dispatch }) => {
					// The transaction changes no content, so it must not reach the
					// markdown serializer or auto-save fires on every re-highlight.
					if (dispatch) dispatch(tr.setMeta(syntaxHighlightPluginKey, tokens))
					return true
				},
		}
	},

	addProseMirrorPlugins() {
		return [
			new Plugin<DecorationSet>({
				key: syntaxHighlightPluginKey,
				state: {
					init: () => DecorationSet.empty,
					apply(tr, current) {
						const tokens = tr.getMeta(syntaxHighlightPluginKey) as
							| PlacedToken[]
							| undefined

						if (tokens) return toDecorations(tr.doc, tokens)

						// Mapping keeps the existing colors roughly in place while the
						// next tokenize pass is still debounced, instead of flickering
						// back to plain text on every keystroke.
						return tr.docChanged ? current.map(tr.mapping, tr.doc) : current
					},
				},
				props: {
					decorations(state) {
						return syntaxHighlightPluginKey.getState(state)
					},
				},
			}),
		]
	},
})
