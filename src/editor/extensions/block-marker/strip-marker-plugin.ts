import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import { BLOCK_MARKER_SPECS } from '@/editor/extensions/block-marker/specs'
import { anyMeta } from '@/editor/extensions/transaction-filters'

/**
 * Set by a construct's own toggle command when it turns the construct *off*
 * (see `blockquote-extension.ts` and friends).
 */
export const STRIP_BLOCK_MARKERS = 'stripBlockMarkers'

/**
 * Removes the marker text a construct left behind when it was toggled off.
 * Lifting a blockquote or a list item only changes structure; its `"> "` or
 * `"- "` is real content and would survive as literal prose, reaching disk as
 * `&gt; text` or `\- item` on the next sync - a toggle that cannot be undone
 * by pressing the same button again.
 *
 * Gated on the toggle's own meta rather than inferred from the document: a
 * paragraph that genuinely starts with `"- "` because somebody typed it is
 * indistinguishable by shape, and must be left alone.
 *
 * Runs after the structural change rather than before it - stripping first
 * would leave a marker-less list item for one transaction, which
 * `marker-sync-plugin.ts` would repair by putting a fresh marker straight back.
 */
export function createStripMarkerPlugin(): Plugin {
	return new Plugin({
		key: new PluginKey('stripBlockMarkers'),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!anyMeta(transactions, STRIP_BLOCK_MARKERS)) return null

			const { $from, $to } = newState.selection
			const range = $from.blockRange($to)
			if (!range) return null

			const found: { from: number; to: number }[] = []
			newState.doc.nodesBetween(range.start, range.end, (node, pos) => {
				if (node.type.name !== 'paragraph') return

				const text = node.textContent
				const length = BLOCK_MARKER_SPECS.reduce(
					(longest, spec) => Math.max(longest, spec.length(text)),
					0
				)
				if (length > 0) found.push({ from: pos + 1, to: pos + 1 + length })
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
