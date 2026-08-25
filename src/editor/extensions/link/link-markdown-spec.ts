import type { Mark, Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import type { DelimiterMarkdownSerialize } from '@/editor/extensions/formatting/delimiter-spec'
import { linkCloseText } from '@/editor/extensions/link/link-close-text'

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
 *
 * - `'autolink'` (`isPlainUrlLink`): unchanged from the stock behavior, `<`/`>`.
 * - `'text'` (`[text](href "title")`): identity - the brackets and
 *   parenthetical are themselves real, marked text now (see
 *   `link-delimiter-spec.ts`), so writing them again here would double them up.
 * - `'atom'` (an image, which has no content of its own to hold literal
 *   syntax in): the classic synthesized `[`/`](href "title")`, the explicit
 *   fallback linked images need, since there is no text run for the
 *   delimiter mechanism to attach to.
 */
function boundaryKind(
	mark: Mark,
	parent: ProseMirrorNode,
	index: number
): BoundaryKind {
	if (isPlainUrlLink(mark, parent, index)) return 'autolink'
	return parent.child(index).isText ? 'text' : 'atom'
}

/**
 * `prosemirror-markdown`'s own serializer state, plus the two fields this
 * mark needs across its own open/close pair. `inLink` is read by
 * `markdown-escaping.ts`'s `esc()` patch - see below for why this mark can't
 * use the usual `escape: false` field the way every other delimited mark does.
 */
export type LinkSerializerState = MarkdownSerializerState & {
	linkBoundaryKind?: BoundaryKind
	inLink?: boolean
}

/**
 * A link's markdown storage, decided per boundary the same way
 * `prosemirror-markdown`'s default one does - see `boundaryKind`.
 *
 * `close` is called with `index` one past the mark's own last child - valid
 * as *a* position (`parent.forEach`'s final call, closing whatever's still
 * open, passes `parent.childCount`), but not one `parent.child(index)` can
 * read, the way `boundaryKind` needs to. Deciding the kind once, in `open`,
 * and stashing it on `state` for `close` to read back - the same trick
 * `prosemirror-markdown`'s own default link serializer uses via
 * `state.inAutolink` - sidesteps that entirely.
 *
 * `escape: false` (every other delimited mark's approach) is unusable here:
 * `prosemirror-markdown` special-cases an `escape: false` mark by excluding
 * it from its node's *open/close count* entirely, relying on a fallback path
 * that only fires for `isText` nodes - so for a link wrapping only an image
 * (see `boundaryKind`'s `'atom'` case), `open`/`close` would silently never
 * be called at all, dropping the link altogether. `inLink` reproduces the
 * same "don't touch my own delimiter characters" effect one layer up, via
 * `markdown-escaping.ts`'s patched `esc()`, without that exclusion.
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
