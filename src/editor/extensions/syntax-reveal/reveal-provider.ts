import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * What role a token plays in its construct's syntax, for styling each part
 * differently - a link's brackets/parens read differently from its URL, which
 * reads differently again from its title. Everything that is not one of these
 * (a heading's title, a list item's text, a link's own visible text) is
 * ordinary content and carries no token at all.
 */
type TokenRole = 'marker' | 'url' | 'title'

/** One typed piece of a construct's syntax - a delimiter, a URL, a title. */
export type RevealToken = {
	role: TokenRole
	from: number
	to: number
}

/**
 * One revealable construct's syntax: `containerFrom`/`containerTo` is the
 * range the caret must touch for `tokens` to stay visible - the whole
 * construct (e.g. a code block's fence-to-fence span), not just the syntax
 * itself, so landing anywhere inside reveals it, not only right on a fence
 * character.
 */
export type RevealSpan = {
	containerFrom: number
	containerTo: number
	tokens: RevealToken[]
	/**
	 * The node to mark `CONSTRUCT_REVEALED_CLASS` on while this span *is*
	 * revealed - every block construct's own element, whether or not it draws
	 * a stand-in for its syntax. A list item's bullet or a task item's
	 * checkbox is the one case that *must* react to it, stepping aside so the
	 * item doesn't read `• - Buy milk`; every other construct's element picks
	 * up the class too, as a hook for styling it while it's being edited.
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
