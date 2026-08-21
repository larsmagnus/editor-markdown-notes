import { PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Extension } from '@tiptap/react'

import { createDecorationPlugin } from '@/editor/extensions/create-decoration-plugin'
import type { Occurrence } from '@/editor/extensions/search-reveal/find-occurrences'

/**
 * Highlights the matches a note was opened on from the search view.
 *
 * Deliberately dumb, the same shape as `text-tools-extension.ts`: React finds
 * the ranges and hands them down, the extension only draws them. `useEditor`
 * builds the editor once, so an extension list that varied with whether a
 * reveal exists would tear the editor down.
 *
 * The name matches no `tiptap-markdown` serializer, so nothing here can reach
 * what gets written back to disk.
 */

const searchRevealPluginKey = new PluginKey<DecorationSet>('searchReveal')

/**
 * Marks the one scrolled to, so it can be told apart from its siblings - and so
 * whatever does the scrolling can find it in the DOM without a second opinion
 * about where it ended up.
 */
export const SEARCH_REVEAL_TARGET_CLASS = 'search-reveal-match--target'

function toDecorations(
	doc: Parameters<typeof DecorationSet.create>[0],
	occurrences: Occurrence[]
): DecorationSet {
	const decorations = occurrences.flatMap((occurrence, index) => {
		// A stale range would throw inside `Decoration.inline`.
		if (occurrence.from >= occurrence.to) return []
		if (occurrence.to > doc.content.size) return []

		return Decoration.inline(occurrence.from, occurrence.to, {
			// The first, which is the one scrolled to: the host names one match and
			// the rest are found by looking for the same text, so document order is
			// all there is to go on.
			class:
				index === 0
					? `search-reveal-match ${SEARCH_REVEAL_TARGET_CLASS}`
					: 'search-reveal-match',
		})
	})

	return DecorationSet.create(doc, decorations)
}

function clearOnInteraction(view: EditorView): false {
	const current = searchRevealPluginKey.getState(view.state)
	if (current && current !== DecorationSet.empty) {
		view.dispatch(view.state.tr.setMeta(searchRevealPluginKey, null))
	}

	return false
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		searchReveal: {
			setSearchRevealRanges: (occurrences: Occurrence[]) => ReturnType
			clearSearchRevealRanges: () => ReturnType
		}
	}
}

export const SearchRevealHighlight = Extension.create({
	name: 'searchReveal',

	addCommands() {
		return {
			setSearchRevealRanges:
				(occurrences: Occurrence[]) =>
				({ tr, dispatch }) => {
					// The transaction changes no content, so it must not reach the
					// markdown serializer or opening a note would autosave it.
					if (dispatch) dispatch(tr.setMeta(searchRevealPluginKey, occurrences))
					return true
				},

			clearSearchRevealRanges:
				() =>
				({ tr, dispatch }) => {
					if (dispatch) dispatch(tr.setMeta(searchRevealPluginKey, null))
					return true
				},
		}
	},

	addProseMirrorPlugins() {
		return [
			createDecorationPlugin<Occurrence[]>(
				searchRevealPluginKey,
				toDecorations,
				{
					// The first thing to change the document after a reveal is not the
					// reader: the trailing-paragraph and frontmatter housekeeping
					// transactions both land after mount, and clearing on those wiped
					// every highlight before it was ever seen. A real edit clears
					// through `handleDOMEvents` below instead - mapping, not dropping,
					// is what keeps the highlight alive until then.
					clearable: true,
					props: {
						// The reveal answers one click and is finished, so the first thing
						// the reader does with the note takes it down. Never handles the
						// event - it only watches for one.
						handleDOMEvents: {
							mousedown: clearOnInteraction,
							keydown: clearOnInteraction,
						},
					},
				}
			),
		]
	},
})
