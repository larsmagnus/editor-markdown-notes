import { Extension } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import {
	markerCaretAtBoundary,
	markerCaretAtFirstContentChar,
} from '@/editor/extensions/block-marker/marker-caret'

/**
 * Backspace right after a construct's own marker removes the whole marker in
 * one keystroke and leaves the construct, instead of deleting into the marker
 * a character at a time. A half-deleted marker fails the sync plugin's parse,
 * which reads it as absent and inserts a fresh one beside the remnant -
 * `- [ ] - [ ] text`. Intercepting the two positions where that can happen is
 * what keeps the malformed state unreachable; every other position falls
 * through to the stock handlers, including offset 0 and merging into the
 * following block.
 *
 * Exit runs *before* the marker text is deleted, and as two transactions
 * rather than one chain. Deleting first leaves the node a list item or
 * blockquote for one transaction - long enough for the sync plugin to see a
 * marker-less construct and put the marker straight back. Chaining the two
 * fails differently: `liftListItem` computes its target against the chain's
 * starting state, so a preceding in-chain delete silently invalidates it.
 */
export const MarkerBackspace = Extension.create({
	name: 'markerBackspace',

	addKeyboardShortcuts() {
		return {
			Backspace: () => {
				const caret = markerCaretAtBoundary(this.editor)
				if (caret) {
					if (!caret.spec.exit?.(this.editor, caret.nodeTypeName)) return false

					const { selection } = this.editor.state
					if (!(selection instanceof TextSelection)) return false

					return this.editor
						.chain()
						.deleteRange({
							from: selection.from - caret.markerLength,
							to: selection.from,
						})
						.run()
				}

				if (!markerCaretAtFirstContentChar(this.editor)) return false
				const { from } = this.editor.state.selection
				return this.editor
					.chain()
					.deleteRange({ from: from - 1, to: from })
					.run()
			},
		}
	},
})
