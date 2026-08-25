import { Extension } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import { listItemAtMarkerBoundary } from '@/editor/extensions/list/list-item-at-marker-boundary'

/**
 * Backspace right after a list item's own bullet/number/checkbox removes the
 * whole marker in one keystroke and lifts the item out of the list, instead
 * of falling through to plain character deletion.
 *
 * Without this, Backspace deletes one character of the marker (typically its
 * trailing space) and leaves a malformed remnant - `list-marker-sync-
 * plugin.ts`'s repair step reads that remnant as "no marker at all" (its
 * strict regex match fails) and *inserts* a fresh canonical marker next to
 * what's left, rather than replacing it, producing `- [ ] - [ ] text`. This
 * extension exists so that malformed intermediate state is never reached in
 * the first place - the same "backspace at marker boundary exits the list"
 * behavior most editors already have, applied here because the marker is
 * real text with no structural boundary of its own to hook a plain keymap to.
 *
 * Lifts the item *before* deleting its marker text, and as two separate
 * transactions rather than one `.chain()`. Deleting first would still leave
 * the node a `listItem`/`taskItem` for one transaction - long enough for
 * `list-marker-sync-plugin.ts`'s own `appendTransaction` to see a marker-less
 * item and immediately re-insert a fresh one, undoing the deletion. Lifting
 * first turns it into a plain paragraph the sync plugin no longer inspects at
 * all. Combining both into one `.chain()` doesn't avoid the race either:
 * `liftListItem` (from `prosemirror-schema-list`) computes its lift target
 * against the chain's *starting* state, so applying it after an in-chain
 * delete has already shifted positions silently fails the whole chain.
 */
export const ListMarkerBackspace = Extension.create({
	name: 'listMarkerBackspace',

	addKeyboardShortcuts() {
		return {
			Backspace: () => {
				const listItemType = listItemAtMarkerBoundary(this.editor)
				if (!listItemType) return false

				const markerLength = this.editor.state.selection.$from.parentOffset

				const lifted = this.editor.chain().liftListItem(listItemType).run()
				if (!lifted) return false

				const { selection } = this.editor.state
				if (!(selection instanceof TextSelection)) return false
				const paragraphStart = selection.from - markerLength

				return this.editor
					.chain()
					.deleteRange({ from: paragraphStart, to: selection.from })
					.run()
			},
		}
	},
})
