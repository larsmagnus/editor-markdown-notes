import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Selection } from '@tiptap/pm/state'

import type {
	RevealProvider,
	RevealSpan,
	RevealToken,
} from '#src/editor/extensions/syntax-reveal/reveal-provider'

/**
 * Whether a selection reaches a span's container, and so reveals its syntax.
 * Shared with the node views that draw differently while their own syntax
 * shows - a task item cannot show both a checkbox and the `[ ]` it stands for.
 */
export function revealsContainer(
	selection: Selection,
	containerFrom: number,
	containerTo: number
): boolean {
	return selection.from <= containerTo && selection.to >= containerFrom
}

/**
 * Every provider's spans for `doc`, remembered while `doc` is the document.
 * Which spans exist depends on the document alone; only whether they are
 * hidden depends on the selection. One entry is enough - ProseMirror replaces
 * the document wholesale, so the previous one is never asked for again.
 */
let cachedDoc: ProseMirrorNode | null = null
let cachedProviders: RevealProvider[] | null = null
let cachedSpans: RevealSpan[] = []

function collectSpans(
	doc: ProseMirrorNode,
	providers: RevealProvider[]
): RevealSpan[] {
	// Keyed on the providers too: a stale hit would hide the wrong ranges, not
	// merely cost a walk.
	if (cachedDoc === doc && cachedProviders === providers) return cachedSpans

	cachedSpans = providers.flatMap((provider) => provider.collect(doc))
	cachedDoc = doc
	cachedProviders = providers
	return cachedSpans
}

/** What the current document and selection imply: tokens to hide or reveal, nodes to mark. */
export type RevealRanges = {
	hidden: RevealToken[]
	revealed: RevealToken[]
	revealedNodes: [number, number][]
}

function validTokens(
	tokens: RevealToken[],
	doc: ProseMirrorNode
): RevealToken[] {
	return tokens.filter(
		(token) => token.from < token.to && token.to <= doc.content.size
	)
}

export function revealRanges(
	doc: ProseMirrorNode,
	selection: Selection,
	providers: RevealProvider[]
): RevealRanges {
	const hidden: RevealToken[] = []
	const revealed: RevealToken[] = []
	const revealedNodes: [number, number][] = []

	for (const span of collectSpans(doc, providers)) {
		if (!revealsContainer(selection, span.containerFrom, span.containerTo)) {
			hidden.push(...validTokens(span.tokens, doc))
			continue
		}

		if (span.revealedNode) revealedNodes.push(span.revealedNode)
		revealed.push(...validTokens(span.tokens, doc))
	}

	return { hidden, revealed, revealedNodes }
}
