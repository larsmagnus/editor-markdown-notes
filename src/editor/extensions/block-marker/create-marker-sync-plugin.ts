import { Fragment } from '@tiptap/pm/model'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import type { EditorState, Transaction } from '@tiptap/pm/state'

import { findMarkerActions } from '@/editor/extensions/block-marker/marker-actions'
import type {
	MarkerAction,
	MarkerFix,
} from '@/editor/extensions/block-marker/marker-actions'
import type { BlockMarkerSpec } from '@/editor/extensions/block-marker/spec'
import { createDeletionProbe } from '@/editor/extensions/syntax-repair/authored-deletion'
import { anyDocChanged } from '@/editor/extensions/transaction-filters'

/**
 * Writes one marker, replacing whatever wrong-length remnant sits there.
 *
 * An empty host is replaced as a whole node rather than written into: its
 * content position sits at the host's own closing token too, and the text
 * insert can resolve at the shallower of those two depths - directly inside
 * the blockquote or list item, which cannot hold text - so ProseMirror wraps
 * it in a second paragraph beside the empty one instead of filling it. This is
 * exactly the state a `wrappingInputRule` leaves behind. Replacing the node
 * with a copy of itself plus the marker is unambiguous at any depth.
 */
function applyFix(tr: Transaction, fix: MarkerFix): void {
	if (fix.host.content.size === 0) {
		const text = tr.doc.type.schema.text(fix.marker + (fix.trailing ?? ''))
		tr.replaceWith(
			fix.nodeStart,
			fix.nodeStart + fix.host.nodeSize,
			fix.host.copy(Fragment.from(text))
		)
		return
	}

	// The closing marker first, so the opening one's positions still hold.
	if (fix.trailing !== undefined) {
		const end = fix.textStart + fix.host.textContent.length
		tr.insertText(fix.trailing, end, end)
	}

	tr.insertText(fix.marker, fix.textStart, fix.textStart + fix.existingLength)
}

/**
 * A caret sitting exactly where a fresh marker is about to land belongs after
 * it, not back before it. Anchored to the host node's own position, which
 * survives both ways of writing a marker - a caret position inside a replaced
 * node maps to the replacement's edge, which is nowhere useful.
 */
function recoverCursor(tr: Transaction, fix: MarkerFix): void {
	const hostStart = tr.mapping.map(fix.nodeStart, -1)
	const target = hostStart + 1 + fix.marker.length
	tr.setSelection(TextSelection.near(tr.doc.resolve(target)))
}

/** The one fix, if any, whose fresh marker would land right where the caret is. */
function fixUnderCaret(
	actions: MarkerAction[],
	state: EditorState
): MarkerFix | undefined {
	if (!state.selection.empty) return undefined

	return actions
		.filter((action) => action.kind === 'fix')
		.map((action) => action.fix)
		.find(
			(fix) =>
				fix.existingLength === 0 && fix.textStart === state.selection.from
		)
}

/**
 * Keeps every block construct's leading marker present and correct, whichever
 * way the construct came to exist - an input rule that consumed the typed
 * marker, `splitListItem`, Tab, paste, or `insertContent`. Without it such a
 * node looks right in the editor while carrying no marker text at all, and
 * serializes - then round-trips back on the next load - as a plain paragraph.
 *
 * The one absent marker it does *not* write back is one the author just
 * deleted, which `findMarkerActions` tells apart by asking what this batch did
 * to the old document. Deleting a marker takes the construct apart instead.
 * Without that distinction markdown syntax cannot be removed by editing it at
 * all: every backspace against a marker is answered by a fresh one.
 *
 * A construct's *kind* is never re-derived here: retyping a bullet's `-` as
 * `1.` leaves a bullet item carrying an unusual marker, not an ordered one,
 * and typing into a task item's brackets is real text editing that
 * `toggle-task-checked-command.ts` reads, not something to overwrite.
 *
 * Actions apply in reverse document order, so writing a later marker never
 * shifts an earlier one's already-read position.
 */
export function createMarkerSyncPlugin(specs: BlockMarkerSpec[]): Plugin {
	return new Plugin({
		key: new PluginKey('blockMarkerSync'),
		appendTransaction: (transactions, oldState, newState: EditorState) => {
			if (!anyDocChanged(transactions)) return null

			const actions = findMarkerActions(
				oldState.doc,
				newState.doc,
				specs,
				createDeletionProbe(transactions)
			)
			if (actions.length === 0) return null

			const caretFix = fixUnderCaret(actions, newState)

			const tr = newState.tr
			for (const action of actions.reverse()) {
				if (action.kind === 'fix') applyFix(tr, action.fix)
				else action.spec.unwrap(tr, action.match)
			}
			if (caretFix) recoverCursor(tr, caretFix)

			return tr
		},
	})
}
