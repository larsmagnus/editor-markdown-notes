import type { Mark, Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import type { DelimiterMarkdownSerialize } from '#src/editor/extensions/formatting/delimiter-spec'
import { linkCloseText } from '#src/editor/extensions/link/link-close-text'

/**
 * Mirrors `prosemirror-markdown`'s own (unexported) `isPlainURL`: a link
 * whose visible text is exactly its `href`, with no title, is an autolink -
 * `<https://x>` - there is nothing else for `<`/`>` to add.
 */
function isPlainUrlLink(
	mark: Mark,
	parent: ProseMirrorNode,
	index: number
): boolean {
	if (mark.attrs.title || !/^\w+:/.test(mark.attrs.href ?? '')) return false
	const content = parent.child(index)
	if (!content.isText || content.text !== mark.attrs.href) return false
	if (content.marks[content.marks.length - 1] !== mark) return false
	return (
		index === parent.childCount - 1 ||
		!mark.isInSet(parent.child(index + 1).marks)
	)
}

type BoundaryKind = 'autolink' | 'text' | 'atom'

/**
 * Which of a link's three serialize cases applies at this boundary:
 * `'autolink'` writes `<`/`>` as stock does; `'text'` writes nothing, its
 * brackets already being real marked text; `'atom'` synthesizes the full
 * `[`/`](href "title")`, which a linked image has no text run to carry.
 */
function boundaryKind(
	mark: Mark,
	parent: ProseMirrorNode,
	index: number
): BoundaryKind {
	if (isPlainUrlLink(mark, parent, index)) return 'autolink'
	return parent.child(index).isText ? 'text' : 'atom'
}

/** The serializer state, plus the two fields a link carries across open/close. */
export type LinkSerializerState = MarkdownSerializerState & {
	linkBoundaryKind?: BoundaryKind
	inLink?: boolean
}

/**
 * A link's markdown storage, decided per boundary.
 *
 * The kind is decided in `open` and stashed on `state`, as
 * `prosemirror-markdown`'s own link serializer does with `state.inAutolink`:
 * `close` receives `index` one past the mark's last child, a valid position
 * but not one `parent.child(index)` can read.
 *
 * `escape: false` - every other delimited mark's approach - is unusable here.
 * `prosemirror-markdown` excludes an `escape: false` mark from its node's
 * open/close count and falls back to a path that only fires for `isText`
 * nodes, so a link wrapping only an image would never open or close at all
 * and the link would be dropped. `inLink` gets the same effect one layer up,
 * through `markdown-escaping.ts`'s patched `esc()`.
 */
export const LINK_MARKDOWN_SERIALIZE: DelimiterMarkdownSerialize = {
	open(
		state: LinkSerializerState,
		mark: Mark,
		parent: ProseMirrorNode,
		index: number
	) {
		const kind = boundaryKind(mark, parent, index)
		state.linkBoundaryKind = kind
		state.inLink = true
		return kind === 'autolink' ? '<' : kind === 'atom' ? '[' : ''
	},
	close(state: LinkSerializerState, mark: Mark) {
		const kind = state.linkBoundaryKind
		state.linkBoundaryKind = undefined
		state.inLink = false
		if (kind === 'autolink') return '>'
		if (kind === 'text') return ''
		return linkCloseText(mark.attrs.href ?? '', mark.attrs.title ?? null)
	},
	mixable: true,
	escape: true,
} as const
