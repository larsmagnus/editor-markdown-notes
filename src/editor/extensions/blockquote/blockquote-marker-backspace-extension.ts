import { Extension } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import {
	isAtBlockquoteFirstContentChar,
	isAtBlockquoteMarkerBoundary,
} from '@/editor/extensions/blockquote/blockquote-marker-boundary'

/**
 * Backspace right after a blockquote's own `"> "` marker lifts the paragraph
 * out of the quote in one keystroke, instead of falling through to plain
 * character deletion and leaving a malformed remnant -
 * `list-marker-backspace-extension.ts` documents the same failure mode for
 * list markers this avoids the same way: exit the construct before its
 * marker text can ever be partially deleted.
 *
 * Also intercepts Backspace one position further in, at the quote's first
 * content character, for the same native-contenteditable-deletion-crosses-
 * the-hidden-marker-span reason `list-marker-backspace-extension.ts`'s
 * first-content-char case documents - applied here from the start per that
 * fix's own lesson, not rediscovered by a bug report.
 *
 * Registered after `BlockquoteExtension` so this runs before the stock
 * `Blockquote`'s own `Backspace` shortcut, which knows nothing about marker
 * text and would otherwise treat "caret at parentOffset 0" (before the
 * marker, not after it) as the exit condition. Falling through to that stock
 * handler for every other position - including offset 0, and merging into a
 * following block - is intentional: this extension only needs to intercept
 * the two positions unique to having real marker text.
 */
export const BlockquoteMarkerBackspace = Extension.create({
	name: 'blockquoteMarkerBackspace',

	addKeyboardShortcuts() {
		return {
			Backspace: () => {
				if (isAtBlockquoteMarkerBoundary(this.editor)) {
					const markerLength = this.editor.state.selection.$from.parentOffset

					const lifted = this.editor.chain().lift('blockquote').run()
					if (!lifted) return false

					const { selection } = this.editor.state
					if (!(selection instanceof TextSelection)) return false
					const paragraphStart = selection.from - markerLength

					return this.editor
						.chain()
						.deleteRange({ from: paragraphStart, to: selection.from })
						.run()
				}

				if (!isAtBlockquoteFirstContentChar(this.editor)) return false
				const { from } = this.editor.state.selection
				return this.editor
					.chain()
					.deleteRange({ from: from - 1, to: from })
					.run()
			},
		}
	},
})
