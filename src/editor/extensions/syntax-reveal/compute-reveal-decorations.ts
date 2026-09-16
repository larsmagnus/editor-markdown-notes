import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

import type { RevealToken } from '#src/editor/extensions/syntax-reveal/reveal-provider'
import type { RevealRanges } from '#src/editor/extensions/syntax-reveal/reveal-ranges'

/** The class every hidden syntax token gets; see `globals.css` for the technique. */
export const SYNTAX_HIDDEN_CLASS = 'syntax-hidden'

/** The class every revealed syntax token gets, carrying its own `data-token` role. */
export const SYNTAX_REVEALED_CLASS = 'syntax-revealed'

/**
 * The class a block construct's own element gets while its syntax is on
 * screen - what lets a list/task item's drawn bullet or checkbox step aside,
 * and a hook for styling any block construct differently while it is being
 * edited. Only reaches constructs ProseMirror renders itself: a node view is
 * handed its decorations rather than having them applied to its DOM, and
 * does not re-render for a change in them, which is why
 * `use-marker-revealed.ts` exists for the ones that have one. Inline marks
 * have no node of their own to carry this - style a whole revealed mark with
 * `strong:has([data-token].syntax-revealed)` instead.
 */
export const CONSTRUCT_REVEALED_CLASS = 'construct-revealed'

function tokenDecoration(token: RevealToken, className: string): Decoration {
	return Decoration.inline(token.from, token.to, {
		class: className,
		'data-token': token.role,
	})
}

/**
 * `ranges` as one comparable value. Two states with equal keys decorate
 * exactly the same text, so a decoration set built for either is valid for
 * the other once mapped.
 */
export function revealKey(ranges: RevealRanges): string {
	const formatTokens = (tokens: RevealToken[]) =>
		tokens.map(({ role, from, to }) => `${role}:${from}:${to}`).join(',')
	const formatRanges = (values: [number, number][]) =>
		values.map(([from, to]) => `${from}:${to}`).join(',')

	return [
		formatTokens(ranges.hidden),
		formatTokens(ranges.revealed),
		formatRanges(ranges.revealedNodes),
	].join('|')
}

/**
 * Hides every syntax token `ranges` marks hidden, and marks both the revealed
 * tokens and the constructs whose syntax they belong to.
 */
export function computeRevealDecorations(
	doc: ProseMirrorNode,
	ranges: RevealRanges
): DecorationSet {
	return DecorationSet.create(doc, [
		...ranges.hidden.map((token) =>
			tokenDecoration(token, SYNTAX_HIDDEN_CLASS)
		),
		...ranges.revealed.map((token) =>
			tokenDecoration(token, SYNTAX_REVEALED_CLASS)
		),
		...ranges.revealedNodes.map(([from, to]) =>
			Decoration.node(from, to, { class: CONSTRUCT_REVEALED_CLASS })
		),
	])
}
