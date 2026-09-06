import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * One revealable construct's syntax: `containerFrom`/`containerTo` is the
 * range the caret must touch for `syntaxRanges` to stay visible - the whole
 * construct (e.g. a code block's fence-to-fence span), not just the syntax
 * itself, so landing anywhere inside reveals it, not only right on a fence
 * character.
 */
export type RevealSpan = {
	containerFrom: number
	containerTo: number
	syntaxRanges: [number, number][]
	/**
	 * A node to mark while this span *is* revealed, for a construct drawing
	 * something that stands in for its own syntax - a list item's bullet, a
	 * task item's checkbox. That stand-in has to step aside while the real text
	 * is on screen, or the item reads `• - Buy milk`.
	 */
	revealedNode?: [number, number]
}

/**
 * One construct's contribution to the shared reveal plugin - a code block,
 * a bold mark, a list item marker, and so on each get their own provider
 * rather than their own plugin, so the whole document is walked once per
 * state read instead of once per construct.
 */
export type RevealProvider = {
	collect(doc: ProseMirrorNode): RevealSpan[]
}
