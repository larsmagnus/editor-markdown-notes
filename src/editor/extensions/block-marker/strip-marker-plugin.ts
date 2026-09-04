import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import { forEachMarkerHost } from '@/editor/extensions/block-marker/marker-host'
import { BLOCK_MARKER_SPECS } from '@/editor/extensions/block-marker/specs'
import { createDeletionProbe } from '@/editor/extensions/syntax-repair/authored-deletion'
import { metaString } from '@/editor/extensions/transaction-filters'

/**
 * Set by a construct's own toggle command when it turns the construct *off*,
 * carrying the node type whose marker is the one to remove (see
 * `with-marker-strip.ts`).
 */
export const STRIP_BLOCK_MARKERS = 'stripBlockMarkers'

/** Whether `pos` still sits inside a construct of one of `nodeTypes`. */
function insideConstruct(
	doc: ProseMirrorNode,
	pos: number,
	nodeTypes: string[]
): boolean {
	const $pos = doc.resolve(pos)
	for (let depth = $pos.depth; depth > 0; depth--) {
		if (nodeTypes.includes($pos.node(depth).type.name)) return true
	}
	return false
}

/**
 * Removes the marker text a construct left behind when it was toggled off.
 * Lifting a blockquote or a list item only changes structure; its `"> "` or
 * `"- "` is real content and would survive as literal prose, reaching disk as
 * `&gt; text` or `\- item` on the next sync - a toggle that cannot be undone
 * by pressing the same button again.
 *
 * Only the toggled construct's own marker goes, and only where that construct
 * is actually gone. Both halves matter: a quote holding a list must not lose
 * the list's bullets, and a nested quote must keep its own `"> "` when the
 * outer one is lifted - it is still a quote. Comparing the two documents is
 * what separates those from the marker that has genuinely been orphaned;
 * shape alone cannot, since a paragraph alongside them may start with `"- "`
 * because somebody typed it.
 *
 * Runs after the structural change rather than before it - stripping first
 * would leave a marker-less list item for one transaction, which
 * `marker-sync-plugin.ts` would repair by putting a fresh marker straight back.
 */
export function createStripMarkerPlugin(): Plugin {
	return new Plugin({
		key: new PluginKey('stripBlockMarkers'),
		appendTransaction: (transactions, oldState, newState) => {
			const toggled = metaString(transactions, STRIP_BLOCK_MARKERS)
			if (!toggled) return null

			const spec = BLOCK_MARKER_SPECS.find((candidate) =>
				candidate.nodeTypes.includes(toggled)
			)
			if (!spec) return null

			const probe = createDeletionProbe(transactions)
			const found: { from: number; to: number }[] = []

			forEachMarkerHost(oldState.doc, [spec], ({ host }) => {
				const length = spec.length(host.node.textContent)
				if (length === 0) return

				const from = probe.forward(host.textStart, -1)
				if (insideConstruct(newState.doc, from, spec.nodeTypes)) return
				found.push({ from, to: from + length })
			})
			if (found.length === 0) return null

			let tr: Transaction | undefined
			// Reverse document order, so deleting a later marker never shifts an
			// earlier one's already-read position.
			for (const { from, to } of found.reverse()) {
				tr = (tr ?? newState.tr).delete(from, to)
			}
			return tr ?? null
		},
	})
}
