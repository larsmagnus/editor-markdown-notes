import { Fragment } from '@tiptap/pm/model'
import type { Node as ProseMirrorNode, NodeType } from '@tiptap/pm/model'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import {
	BLOCKQUOTE_MARKER,
	blockquoteMarkerLength,
	firstParagraphNodeStart,
	firstParagraphStart,
} from '@/editor/extensions/blockquote/blockquote-marker'

type MissingMarker = { pos: number; paragraph: ProseMirrorNode }

/**
 * Gives every `blockquote`'s own first paragraph a leading `"> "` marker -
 * the counterpart to `list-marker-sync-plugin.ts`, for every path that can
 * leave a blockquote without one: the stock `wrappingInputRule` (which
 * consumes the typed `"> "` entirely, leaving an empty paragraph), paste,
 * or `insertContent`.
 *
 * Only the blockquote's own first paragraph is ever touched - a
 * multi-paragraph quote's later paragraphs keep the wrapping node's
 * synthesized `"> "` at save time, unchanged (see
 * `blockquote-markdown-spec.ts`); only the first line's marker is real,
 * editable text, the plan's deliberately scoped-down option for
 * multi-paragraph quotes. The same is true of nesting: an outer blockquote
 * whose first child is itself a blockquote (not a paragraph) is skipped
 * entirely here, so only the innermost level around an actual paragraph
 * ever gets a real marker - every ancestor level keeps contributing its own
 * `"> "` through ordinary `wrapBlock` synthesis, unaffected.
 *
 * Replaces the whole paragraph node (`firstParagraphNodeStart`) rather than
 * `insertText`-ing into its content (`firstParagraphStart`): for a *freshly
 * wrapped, still-empty* paragraph (exactly what `wrappingInputRule` leaves
 * behind), the content position sits right at the paragraph's own closing
 * token too, and `insertText` there can resolve at the shallower of the two
 * valid depths - inserting a bare text node directly into the blockquote,
 * which isn't valid content for it, so ProseMirror auto-wraps it in a
 * *second*, new paragraph instead of placing it inside the existing one.
 * Replacing the paragraph node's own outer range with a fresh copy of itself
 * (plus the marker) is unambiguous regardless of whether it started empty.
 */
export function createBlockquoteMarkerSyncPlugin(type: NodeType): Plugin {
	return new Plugin({
		key: new PluginKey('blockquoteMarkerSync'),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!transactions.some((transaction) => transaction.docChanged)) {
				return null
			}

			const missing: MissingMarker[] = []
			newState.doc.descendants((node, pos) => {
				if (node.type !== type) return
				const paragraph = node.firstChild
				if (!paragraph || paragraph.type.name !== 'paragraph') return
				if (blockquoteMarkerLength(paragraph.textContent) > 0) return
				missing.push({ pos, paragraph })
			})
			if (missing.length === 0) return null

			const { selection } = newState
			const recoverCursor =
				selection.empty &&
				missing.some(({ pos }) => firstParagraphStart(pos) === selection.from)

			let tr: Transaction | undefined
			for (const { pos, paragraph } of missing.reverse()) {
				const target = tr ?? newState.tr
				const paragraphNodeStart = firstParagraphNodeStart(pos)
				const marker = newState.schema.text(BLOCKQUOTE_MARKER)
				const withMarker = paragraph.copy(
					Fragment.from(marker).append(paragraph.content)
				)
				target.replaceWith(
					paragraphNodeStart,
					paragraphNodeStart + paragraph.nodeSize,
					withMarker
				)
				tr = target
			}
			if (!tr) return null

			// A fresh, empty quote's marker lands exactly at the cursor's own
			// position - mapping with a forward bias (`1`) is what puts the
			// cursor after it rather than back before it, the same problem
			// `list-marker-sync-plugin.ts`'s `recoverCursor` solves.
			if (recoverCursor) {
				const mapped = tr.mapping.map(selection.from, 1)
				tr.setSelection(TextSelection.near(tr.doc.resolve(mapped)))
			}

			return tr
		},
	})
}
