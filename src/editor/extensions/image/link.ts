import type { Command, EditorState, Transaction } from '@tiptap/pm/state'

export type ImageLinkAttrs = { href: string; title?: string | null }

/** The image node at `pos` and its own range, or `null` if it isn't one. */
function imageNodeRange(state: EditorState, pos: number) {
	const node = state.doc.nodeAt(pos)
	if (!node || node.type.name !== 'image') return null
	return { from: pos, to: pos + node.nodeSize }
}

/** Declines at a non-image position, otherwise applies `mutate` to the image's own mark range. */
function imageLinkCommand(
	pos: number,
	mutate: (tr: Transaction, range: { from: number; to: number }) => void
): Command {
	return (state, dispatch) => {
		const range = imageNodeRange(state, pos)
		if (!range) return false

		if (dispatch) {
			const tr = state.tr
			mutate(tr, range)
			dispatch(tr)
		}
		return true
	}
}

/**
 * Wraps the image at `pos` in a link, replacing any it already has. Not
 * `apply-link-command.ts`: that wraps a selection in literal `[`/`]` text,
 * which an image has no text run to hold - `link-markdown-spec.ts`'s
 * `'atom'` boundary synthesizes the markdown from the mark alone. Mark types
 * self-exclude by default, so `addMark` alone also covers replacing attrs.
 */
export function setImageLink(pos: number, attrs: ImageLinkAttrs): Command {
	return imageLinkCommand(pos, (tr, { from, to }) => {
		tr.addMark(from, to, tr.doc.type.schema.marks.link.create(attrs))
	})
}

/** Removes the link mark from the image at `pos`, if it has one. */
export function unsetImageLink(pos: number): Command {
	return imageLinkCommand(pos, (tr, { from, to }) => {
		tr.removeMark(from, to, tr.doc.type.schema.marks.link)
	})
}
