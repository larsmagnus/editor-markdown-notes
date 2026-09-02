import type { Transaction } from '@tiptap/pm/state'
import { liftTarget } from '@tiptap/pm/transform'

import type { MarkerMatch } from '@/editor/extensions/block-marker/marker-host'

/**
 * The construct's own content range, one position inside its opening and
 * closing tokens. Read off the live transaction rather than the match, whose
 * node was found in whatever document the walk started from.
 */
function contentRange(tr: Transaction, match: MarkerMatch) {
	const node = tr.doc.nodeAt(match.pos)
	if (!node) return null
	return { from: match.pos + 1, to: match.pos + node.nodeSize - 1 }
}

/** Turns the construct's own textblock into a paragraph, content untouched. */
export function unwrapToParagraph(tr: Transaction, match: MarkerMatch): void {
	const range = contentRange(tr, match)
	const paragraph = tr.doc.type.schema.nodes.paragraph
	if (!range || !paragraph) return

	tr.setBlockType(range.from, range.to, paragraph)
}

/**
 * Lifts the construct's content out of it, which for a middle list item splits
 * the list around the lifted block - `Transform.lift` handles that itself.
 */
export function liftOutOfConstruct(tr: Transaction, match: MarkerMatch): void {
	const content = contentRange(tr, match)
	if (!content) return

	const range = tr.doc
		.resolve(content.from)
		.blockRange(tr.doc.resolve(content.to))
	if (!range) return

	const target = liftTarget(range)
	if (target === null) return

	tr.lift(range, target)
}
