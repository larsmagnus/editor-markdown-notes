import type { Command, EditorState } from '@tiptap/pm/state'
import { TextSelection } from '@tiptap/pm/state'

import { imageMarkdownSource } from '#src/editor/extensions/image/image-markdown-text'
import type { ImageAttrs } from '#src/editor/extensions/image/image-markdown-text'
import type { ImageSourceMatch } from '#src/editor/extensions/image/image-source-node'
import {
	caretInsideSource,
	finalizeImageSource,
	findImageSource,
	ImageSource as ImageSourceSchema,
	removeSourceNode,
} from '#src/editor/extensions/image/image-source-node'

/** The attrs the image had when editing began, restored by `cancelImageSource`. */
let originalAttrs: ImageAttrs | null = null

/**
 * Reveals the image at `pos`'s markdown as real text immediately above it,
 * selecting its path (the `src`/title inside the parens, excluding them) with
 * the caret at the end - the toolbar's "Edit source" entry point. Takes the
 * position directly rather than reading it off the selection: the toolbar
 * button lives in that image's own node view and already knows it.
 *
 * Callers must run this through `editor.chain().focus().command(...)`, never
 * invoked bare - the toolbar button that reaches it lives outside the
 * editor's own contenteditable region, and TipTap's `.focus()` chain command
 * is what gets the DOM's real selection to actually move here, in the same
 * carefully-ordered dispatch every other command in this codebase reaching
 * outside contenteditable already relies on. A bare `view.focus()` either
 * before or after this command's own `dispatch` raced it instead: before,
 * against ProseMirror's own state having already moved on since `state` was
 * captured; after, against the DOM selection sync `dispatch` only performs
 * while the view already has focus.
 *
 * Finalizes any still-open source on another image first, in the same
 * transaction: every toolbar is hover-revealed independently of the caret,
 * so opening a second image's source without leaving the first is reachable,
 * and `findImageSource` assumes at most one `imageSource` node exists.
 */
export function enterImageEditSource(pos: number): Command {
	return (state, dispatch) => {
		const node = state.doc.nodeAt(pos)
		if (node?.type.name !== 'image') return false

		const attrs: ImageAttrs = {
			src: String(node.attrs.src ?? ''),
			alt: String(node.attrs.alt ?? ''),
			title: node.attrs.title ? String(node.attrs.title) : null,
		}

		if (dispatch) {
			const tr = state.tr
			const existing = findImageSource(tr.doc)
			let insertPos = pos
			if (existing) {
				finalizeImageSource(tr, existing)
				insertPos = tr.mapping.map(pos)
			}

			const { text, pathFrom, pathTo } = imageMarkdownSource(attrs)
			const sourceNode = tr.doc.type.schema.nodes.imageSource.create(
				null,
				tr.doc.type.schema.text(text)
			)

			tr.insert(insertPos, sourceNode)
			const contentStart = insertPos + 1
			tr.setSelection(
				TextSelection.create(
					tr.doc,
					contentStart + pathFrom,
					contentStart + pathTo
				)
			)
			originalAttrs = attrs
			dispatch(tr.scrollIntoView())
		}
		return true
	}
}

/**
 * Finalizes the revealed text: parses it into the image's attrs, or deletes
 * the image outright if it was cleared - the shared tail of every explicit
 * exit (`Enter`, and arrowing off the end). `sync-image-source-plugin.ts`'s
 * generic cleanup does the equivalent for every other way of leaving, where
 * native caret movement already decided where the selection belongs and this
 * must not override it.
 */
function finalizeCommand(
	canExit: (state: EditorState, match: ImageSourceMatch) => boolean
): Command {
	return (state, dispatch) => {
		const match = findImageSource(state.doc)
		if (!match || !canExit(state, match)) return false

		if (dispatch) {
			const tr = state.tr
			finalizeImageSource(tr, match)
			originalAttrs = null
			dispatch(tr.scrollIntoView())
		}
		return true
	}
}

/** `Enter` inside the revealed text: finalizes it, rather than splitting the paragraph. */
export function commitImageSource(): Command {
	return finalizeCommand(caretInsideSource)
}

/**
 * `Escape` inside the revealed text: reverts to the attrs the image had
 * before editing began, discarding whatever is mid-typed, and selects the
 * image.
 */
export function cancelImageSource(): Command {
	return (state, dispatch) => {
		const match = findImageSource(state.doc)
		if (!match || !caretInsideSource(state, match)) return false

		if (dispatch) {
			const tr = state.tr
			removeSourceNode(tr, match, originalAttrs)
			originalAttrs = null
			dispatch(tr.scrollIntoView())
		}
		return true
	}
}

/**
 * The schema node plus its own keymap - kept together since neither is useful
 * without the other, and `image-source-node.ts` stays free to import from
 * here without a cycle.
 */
export const ImageSource = ImageSourceSchema.extend({
	addKeyboardShortcuts() {
		return {
			Enter: () =>
				commitImageSource()(this.editor.state, this.editor.view.dispatch),
			Escape: () =>
				cancelImageSource()(this.editor.state, this.editor.view.dispatch),
		}
	},
})
