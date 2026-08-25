import type { Schema } from '@tiptap/pm/model'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import {
	bulletMarkerText,
	firstParagraphStart,
	orderedMarkerText,
	parseListMarker,
	taskMarkerText,
} from '@/editor/extensions/list/list-marker'

type MarkerFix = {
	/** Position of the item's first paragraph's own text start. */
	paragraphStart: number
	/** Length of whatever marker (if any) already sits there, to replace. */
	existingLength: number
	marker: string
}

/**
 * Gives every `listItem`/`taskItem` a marker matching what it structurally
 * is, and keeps an ordered item's number current - the counterpart to
 * `heading-input-rule.ts`'s safety net, generalized to every path that can
 * leave an item with no marker text at all: `splitListItem` (Enter),
 * `sinkListItem`/`liftListItem` (Tab/Shift-Tab, which don't touch an item's
 * own text), paste, or `insertContent`.
 *
 * Deliberately one-directional for a task item's checked state: this only
 * ever fixes *absent* marker text, never rewrites `[ ]`↔`[x]` to match
 * `node.attrs.checked` - typing directly into the bracket is real text
 * editing (see `toggle-task-checked-command.ts`, which is what keeps the
 * attribute in sync with typed text, not the reverse). Renumbering an
 * ordered item corrects its number but never its dot-vs-paren style or its
 * bullet's character - those stay whatever the author chose.
 *
 * Kind/number is derived from each item's own node type and its immediate
 * parent list, not from `list-marker.ts` alone - retyping a bullet's `-`
 * into `1.` does not change what kind of item it structurally is; a bullet
 * item that happens to read `1. text` is simply a bullet item with an
 * unusual (but valid) marker character, not promoted into an ordered one.
 * That promotion is out of scope here - see the plan doc.
 */
export function createListMarkerSyncPlugin(schema: Schema): Plugin {
	return new Plugin({
		key: new PluginKey('listMarkerSync'),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!transactions.some((transaction) => transaction.docChanged)) {
				return null
			}

			const { listItem, taskItem, orderedList } = schema.nodes
			if (!listItem) return null

			const fixes: MarkerFix[] = []

			newState.doc.descendants((node, pos, parent, index) => {
				if (node.type !== listItem && node.type !== taskItem) return

				const paragraph = node.firstChild
				if (!paragraph || paragraph.type.name !== 'paragraph') return

				const paragraphStart = firstParagraphStart(pos)
				const text = paragraph.textContent
				const parsed = parseListMarker(text)

				if (node.type === taskItem) {
					if (parsed?.kind === 'task') return
					fixes.push({
						paragraphStart,
						existingLength: parsed?.markerLength ?? 0,
						marker: taskMarkerText(Boolean(node.attrs.checked)),
					})
					return
				}

				if (parent?.type === orderedList) {
					const expected = (parent.attrs.start ?? 1) + index
					if (parsed?.kind === 'ordered' && parsed.number === expected) return
					fixes.push({
						paragraphStart,
						existingLength: parsed?.markerLength ?? 0,
						marker: orderedMarkerText(expected),
					})
					return
				}

				if (parsed?.kind === 'bullet') return
				fixes.push({
					paragraphStart,
					existingLength: parsed?.markerLength ?? 0,
					marker: bulletMarkerText(),
				})
			})

			if (fixes.length === 0) return null

			const { selection } = newState
			const recoverCursor =
				selection.empty &&
				fixes.some(
					(fix) =>
						fix.existingLength === 0 && fix.paragraphStart === selection.from
				)

			let tr: Transaction | undefined
			for (const fix of [...fixes].reverse()) {
				const target = tr ?? newState.tr
				target.insertText(
					fix.marker,
					fix.paragraphStart,
					fix.paragraphStart + fix.existingLength
				)
				tr = target
			}
			if (!tr) return null

			// A fresh item's marker lands exactly at the cursor's own position -
			// mapping with a forward bias (`1`) is what puts the cursor after it
			// rather than back before it, the same problem `skip-heading-marker.ts`
			// solves for Tab-entry into a heading.
			if (recoverCursor) {
				const mapped = tr.mapping.map(selection.from, 1)
				tr.setSelection(TextSelection.near(tr.doc.resolve(mapped)))
			}

			return tr
		},
	})
}
