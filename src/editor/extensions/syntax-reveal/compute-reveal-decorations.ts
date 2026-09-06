import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Selection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

import type {
	RevealProvider,
	RevealSpan,
} from '@/editor/extensions/syntax-reveal/reveal-provider'

/** The class every hidden syntax range gets; see `globals.css` for the technique. */
export const SYNTAX_HIDDEN_CLASS = 'syntax-hidden'

/**
 * The class a construct gets while its own syntax is on screen, so whatever it
 * draws in that syntax's place can step aside. Only reaches constructs
 * ProseMirror renders itself: a node view is handed its decorations rather
 * than having them applied to its DOM, and does not re-render for a change in
 * them, which is why `use-marker-revealed.ts` exists for the ones that have
 * one.
 */
const MARKER_REVEALED_CLASS = 'marker-revealed'

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

/** What the current document and selection imply: ranges to hide, nodes to mark. */
type RevealRanges = {
	hidden: [number, number][]
	revealedNodes: [number, number][]
}

function revealRanges(
	doc: ProseMirrorNode,
	selection: Selection,
	providers: RevealProvider[]
): RevealRanges {
	const hidden: [number, number][] = []
	const revealedNodes: [number, number][] = []

	for (const span of collectSpans(doc, providers)) {
		if (revealsContainer(selection, span.containerFrom, span.containerTo)) {
			if (span.revealedNode) revealedNodes.push(span.revealedNode)
			continue
		}

		for (const [from, to] of span.syntaxRanges) {
			if (from >= to || to > doc.content.size) continue
			hidden.push([from, to])
		}
	}

	return { hidden, revealedNodes }
}

/**
 * The decorations this document and selection imply, as one comparable value.
 * Two states with equal keys decorate exactly the same text, so a decoration
 * set built for either is valid for the other once mapped.
 */
export function revealKey(
	doc: ProseMirrorNode,
	selection: Selection,
	providers: RevealProvider[]
): string {
	const { hidden, revealedNodes } = revealRanges(doc, selection, providers)
	const format = (ranges: [number, number][]) =>
		ranges.map(([from, to]) => `${from}:${to}`).join(',')

	return `${format(hidden)}|${format(revealedNodes)}`
}

/**
 * Hides every syntax range the selection does not reach, and marks the
 * constructs whose syntax it does. Overlap, not full containment - dragging
 * from inside a code block out into the paragraph after it reveals the block's
 * syntax rather than needing the whole block selected.
 */
export function computeRevealDecorations(
	doc: ProseMirrorNode,
	selection: Selection,
	providers: RevealProvider[]
): DecorationSet {
	const { hidden, revealedNodes } = revealRanges(doc, selection, providers)

	return DecorationSet.create(doc, [
		...hidden.map(([from, to]) =>
			Decoration.inline(from, to, { class: SYNTAX_HIDDEN_CLASS })
		),
		...revealedNodes.map(([from, to]) =>
			Decoration.node(from, to, { class: MARKER_REVEALED_CLASS })
		),
	])
}
