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

/**
 * The hidden ranges this document and selection imply, as one comparable
 * value. Two states with equal keys hide exactly the same text, so a
 * decoration set built for either is valid for the other once mapped.
 */
export function revealKey(
	doc: ProseMirrorNode,
	selection: Selection,
	providers: RevealProvider[]
): string {
	return hiddenRanges(doc, selection, providers)
		.map(([from, to]) => `${from}:${to}`)
		.join(',')
}

/** Every syntax range the selection does not currently reveal. */
function hiddenRanges(
	doc: ProseMirrorNode,
	selection: Selection,
	providers: RevealProvider[]
): [number, number][] {
	const ranges: [number, number][] = []

	for (const span of collectSpans(doc, providers)) {
		if (revealsContainer(selection, span.containerFrom, span.containerTo)) {
			continue
		}

		for (const [from, to] of span.syntaxRanges) {
			if (from >= to || to > doc.content.size) continue
			ranges.push([from, to])
		}
	}

	return ranges
}

/**
 * Hides every syntax range the selection does not reach. Overlap, not full
 * containment - dragging from inside a code block out into the paragraph after
 * it reveals the block's syntax rather than needing the whole block selected.
 */
export function computeRevealDecorations(
	doc: ProseMirrorNode,
	selection: Selection,
	providers: RevealProvider[]
): DecorationSet {
	return DecorationSet.create(
		doc,
		hiddenRanges(doc, selection, providers).map(([from, to]) =>
			Decoration.inline(from, to, { class: SYNTAX_HIDDEN_CLASS })
		)
	)
}
