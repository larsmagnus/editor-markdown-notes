import { Extension } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'

import { caretToContentStart } from '#src/editor/extensions/block-marker/caret-to-content-start'
import {
	markerCaretAtFirstContentChar,
	markerCaretBeforeMarker,
	markerCaretInMarker,
	nextItemMarker,
} from '#src/editor/extensions/block-marker/marker-caret'
import type { MarkerCaret } from '#src/editor/extensions/block-marker/marker-caret'

/**
 * Steps a marker down, or removes it and the construct with it. One
 * transaction either way: the construct and its marker text stop agreeing in
 * between, and any state where they disagree is one the repair pass has to
 * guess about.
 */
function backspaceMarker(tr: Transaction, caret: MarkerCaret): void {
	const markerEnd = caret.markerStart + caret.markerLength
	const demoted = caret.spec.demote(caret.text)

	if (demoted !== null) {
		tr.insertText(demoted, caret.markerStart, markerEnd)
		caretToContentStart(tr, caret.markerStart + demoted.length)
		return
	}

	tr.delete(caret.markerStart, markerEnd)
	caret.spec.unwrap(tr, caret.match)
	caretToContentStart(tr, caret.markerStart)
}

/**
 * Backspace against a construct's own marker removes the whole marker in one
 * keystroke - a heading dropping a level at a time, everything else going in
 * one - and takes the construct apart once there is no marker left. Deleting
 * into a marker a character at a time is what this exists to prevent: the
 * remnant fails its spec's parse, and a construct carrying an unparseable
 * marker is indistinguishable from one that never had a marker at all.
 *
 * Before a top-level item's or a blockquote's marker it does the same, rather
 * than leave the marker behind as literal text (`markerCaretBeforeMarker`).
 *
 * Delete at the end of a line joins the next list item's text onto it, the
 * item's marker going with the line break, the way deleting the newline
 * before a `- ` line does in the file. Left to the stock handler, the marker
 * was joined on as text: `- one- two`.
 *
 * Every other position falls through to the stock handlers.
 */
export const MarkerBackspace = Extension.create({
	name: 'markerBackspace',

	addKeyboardShortcuts() {
		return {
			Backspace: () => {
				const caret =
					markerCaretInMarker(this.editor) ??
					markerCaretBeforeMarker(this.editor)
				if (caret) {
					const tr = this.editor.state.tr
					backspaceMarker(tr, caret)
					this.editor.view.dispatch(tr)
					return true
				}

				if (!markerCaretAtFirstContentChar(this.editor)) return false
				const { from } = this.editor.state.selection
				return this.editor
					.chain()
					.deleteRange({ from: from - 1, to: from })
					.run()
			},
			Delete: () => {
				const next = nextItemMarker(this.editor)
				if (!next) return false
				return this.editor
					.chain()
					.deleteRange({
						from: next.markerStart,
						to: next.markerStart + next.markerLength,
					})
					.joinTextblockForward()
					.run()
			},
		}
	},
})
