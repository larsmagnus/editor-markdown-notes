import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Selection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

import type { RevealProvider } from '@/editor/extensions/syntax-reveal/reveal-provider'

/** The class every hidden syntax range gets; see `globals.css` for the technique. */
export const SYNTAX_HIDDEN_CLASS = 'syntax-hidden'

/**
 * Hides every provider's syntax ranges except where the selection overlaps
 * their container - overlap, not full containment, so a selection that only
 * touches part of a construct (dragging from inside a code block out into the
 * paragraph after it) still reveals that construct's syntax rather than
 * requiring the whole construct to be selected first.
 */
export function computeRevealDecorations(
	doc: ProseMirrorNode,
	selection: Selection,
	providers: RevealProvider[]
): DecorationSet {
	const decorations: Decoration[] = []

	for (const provider of providers) {
		for (const span of provider.collect(doc)) {
			const overlaps =
				selection.from <= span.containerTo && selection.to >= span.containerFrom

			if (overlaps) continue

			for (const [from, to] of span.syntaxRanges) {
				if (from >= to || to > doc.content.size) continue
				decorations.push(
					Decoration.inline(from, to, { class: SYNTAX_HIDDEN_CLASS })
				)
			}
		}
	}

	return DecorationSet.create(doc, decorations)
}
