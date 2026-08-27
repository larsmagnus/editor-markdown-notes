import { Fragment } from '@tiptap/pm/model'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import type { EditorState, Transaction } from '@tiptap/pm/state'

import { forEachMarkerHost } from '@/editor/extensions/block-marker/marker-host'
import type { BlockMarkerSpec } from '@/editor/extensions/block-marker/spec'
import { anyDocChanged } from '@/editor/extensions/transaction-filters'

type MarkerFix = {
	host: ProseMirrorNode
	nodeStart: number
	textStart: number
	existingLength: number
	marker: string
}

/** Every construct whose marker text is absent, wrong or stale, in document order. */
function findFixes(
	doc: ProseMirrorNode,
	specs: BlockMarkerSpec[]
): MarkerFix[] {
	const fixes: MarkerFix[] = []

	forEachMarkerHost(doc, specs, ({ spec, host, node, parent, index }) => {
		const text = host.node.textContent
		const existingLength = spec.length(text)
		const marker = spec.resolve({ node, parent, index, text })
		if (marker === text.slice(0, existingLength)) return

		fixes.push({
			host: host.node,
			nodeStart: host.nodeStart,
			textStart: host.textStart,
			existingLength,
			marker,
		})
	})

	return fixes
}

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
		const marker = tr.doc.type.schema.text(fix.marker)
		tr.replaceWith(
			fix.nodeStart,
			fix.nodeStart + fix.host.nodeSize,
			fix.host.copy(Fragment.from(marker))
		)
		return
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

/**
 * Keeps every block construct's leading marker present and correct, whichever
 * way the construct came to exist - an input rule that consumed the typed
 * marker, `splitListItem`, Tab, paste, or `insertContent`. Without it such a
 * node looks right in the editor while carrying no marker text at all, and
 * serializes - then round-trips back on the next load - as a plain paragraph.
 *
 * A construct's *kind* is never re-derived here: retyping a bullet's `-` as
 * `1.` leaves a bullet item carrying an unusual marker, not an ordered one,
 * and typing into a task item's brackets is real text editing that
 * `toggle-task-checked-command.ts` reads, not something to overwrite. Each
 * spec's `resolve` decides how much of its own marker is the author's to keep.
 *
 * Fixes apply in reverse document order, so writing a later marker never
 * shifts an earlier one's already-read position.
 */
export function createMarkerSyncPlugin(specs: BlockMarkerSpec[]): Plugin {
	return new Plugin({
		key: new PluginKey('blockMarkerSync'),
		appendTransaction: (transactions, _oldState, newState: EditorState) => {
			if (!anyDocChanged(transactions)) return null

			const fixes = findFixes(newState.doc, specs)
			if (fixes.length === 0) return null

			const { selection } = newState
			const caretAtFreshMarker = selection.empty
				? fixes.find(
						(fix) =>
							fix.existingLength === 0 && fix.textStart === selection.from
					)
				: undefined

			const tr = newState.tr
			for (const fix of fixes.reverse()) applyFix(tr, fix)
			if (caretAtFreshMarker) recoverCursor(tr, caretAtFreshMarker)

			return tr
		},
	})
}
