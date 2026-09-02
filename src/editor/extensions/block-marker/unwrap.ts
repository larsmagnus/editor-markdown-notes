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

/**
 * Replaces a fenced construct with a paragraph holding what was between its
 * fences. Unlike the other two this cannot lift or retype the node: its
 * content is one text node with embedded newlines, which a paragraph holds
 * only after the fence lines are cut out of it.
 *
 * The fences are matched here rather than read from the spec's own parser,
 * which needs a *complete* fence pair to report either one. By the time this
 * runs the author has deleted one of them, and the survivor must go too - left
 * behind in the paragraph it would read as an opening fence again on the next
 * load.
 */
export function unwrapFenced(fenceChar: string) {
	const open = new RegExp(`^${fenceChar}{3,}[^\\n]*\\n?`)
	const close = new RegExp(`\\n?${fenceChar}{3,}[ \\t]*$`)

	return (tr: Transaction, match: MarkerMatch): void => {
		const node = tr.doc.nodeAt(match.pos)
		const paragraph = tr.doc.type.schema.nodes.paragraph
		if (!node || !paragraph) return

		const code = node.textContent.replace(open, '').replace(close, '')

		tr.replaceWith(
			match.pos,
			match.pos + node.nodeSize,
			paragraph.create(null, code ? tr.doc.type.schema.text(code) : undefined)
		)
	}
}
