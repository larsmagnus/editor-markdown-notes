import type { Editor } from '@tiptap/core'

import { caretToContentStart } from '#src/editor/extensions/block-marker/caret-to-content-start'
import type { MarkerCaret } from '#src/editor/extensions/block-marker/marker-caret'

/**
 * Whether `liftListItem` would outdent this item into the list above it rather
 * than lift it clean out of every list. It decides that by comparing the
 * enclosing item's type to the one it is handed, so the test has to be that
 * same identity and not "some kind of list item" - a task list nested under a
 * bullet item takes the other branch.
 *
 * Resolved from the item the caret already found rather than re-read off the
 * selection, so the branch is decided about the same item that is then acted
 * on. Read off the live selection instead, the two agree only as long as every
 * caller resolves its caret immediately beforehand, and a caller that does not
 * silently gets a nested item's marker deleted.
 */
function liftsToOuterList(editor: Editor, caret: MarkerCaret): boolean {
	// Resolving the item's own position lands in its list; one shallower again
	// is whatever encloses that list.
	const $item = editor.state.doc.resolve(caret.match.pos)
	if ($item.depth < 1) return false
	return $item.node($item.depth - 1).type.name === caret.nodeTypeName
}

/**
 * Takes a list item one level out: into the list above where there is one, and
 * out of the list entirely - content intact, as an ordinary paragraph - where
 * there is not.
 *
 * `liftListItem` alone covers only the first case. Handed a top-level item, or
 * one nested under an item of a different type, it lifts the content out of
 * every list while leaving the marker behind as ordinary text, which serializes
 * escaped (`\- Two`) and reaches the file as prose. So the marker is deleted
 * here instead, in the same transaction as the lift: a marker that goes without
 * its construct going with it is what `syntax-repair/authored-deletion.ts`
 * answers with a fresh copy.
 */
export function outdentListItem(editor: Editor, caret: MarkerCaret): boolean {
	if (liftsToOuterList(editor, caret)) {
		return editor.commands.liftListItem(caret.nodeTypeName)
	}

	const tr = editor.state.tr
	tr.delete(caret.markerStart, caret.markerStart + caret.markerLength)
	caret.spec.unwrap(tr, caret.match)
	caretToContentStart(tr, caret.markerStart)
	editor.view.dispatch(tr.scrollIntoView())
	return true
}
