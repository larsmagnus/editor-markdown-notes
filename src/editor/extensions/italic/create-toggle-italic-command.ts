import type { CommandProps } from '@tiptap/core'
import type { MarkType } from '@tiptap/pm/model'

import { toggleDelimitedMark } from '@/editor/extensions/formatting/toggle-delimited-mark'
import { italicDelimiterSpec } from '@/editor/extensions/italic/italic-delimiter-spec'
import { italicWrapMarkup } from '@/editor/extensions/italic/italic-wrap-markup'

/**
 * `toggleItalic`'s body - separate from `create-toggle-mark-command.ts`
 * because italic's delimiter isn't a constant: wrapping a fresh selection
 * needs `italicWrapMarkup` to pick `_`/`*` from the selection's own context
 * before it can be passed on, where bold/strike's `createToggleMarkCommand`
 * already knows its fixed delimiter up front. `getPreferredMarkup` reads
 * `storage.preferredMarkup` lazily rather than once, since it can change
 * live (`editorMarkdownNotes.italicMarker`) between calls.
 */
export function createToggleItalicCommand(
	markType: MarkType,
	markName: string,
	getPreferredMarkup: () => string
) {
	return ({ state, dispatch, chain }: CommandProps): boolean => {
		const preferredMarkup = getPreferredMarkup()

		if (!state.selection.empty) {
			const { from, to } = state.selection
			const markup = italicWrapMarkup(state.doc, from, to, preferredMarkup)
			const wrapDelimiters = { open: markup, close: markup }
			if (
				toggleDelimitedMark(markType, italicDelimiterSpec(), wrapDelimiters, {
					markup,
				})(state, dispatch)
			) {
				return true
			}
		}

		return chain().toggleMark(markName, { markup: preferredMarkup }).run()
	}
}
