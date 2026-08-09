import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Mark, Node as ProseMirrorNode } from 'prosemirror-model'

/**
 * One side of a `tiptap-markdown` mark serializer, `open` or `close`.
 *
 * The two sides are handed the same `parent` but resolve different children:
 * `open` runs before the marked node at `index`, `close` after the one at
 * `index - 1`. Which of those a serializer wants is its own business — the code
 * fence reads the child, the italic marker walks out from the index — so this is
 * only the shape, not shared behaviour.
 */
export type MarkSerializerSide = (
	state: MarkdownSerializerState,
	mark: Mark,
	parent: ProseMirrorNode,
	index: number
) => string

/** markdown-it handles parsing; `tiptap-markdown` still wants the key present. */
export const PARSED_BY_MARKDOWN_IT = {}
