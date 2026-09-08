import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { isWordChar } from '#src/lib/word-boundary'

/**
 * The italic markup character to wrap a fresh (not-yet-marked) selection in
 * - `preferredMarkup`, falling back to `*` when that would land the marker
 * mid-word, the same CommonMark constraint `italicMarkup` enforces for an
 * existing run. There is no mark to walk contiguous siblings through yet, so
 * this checks the plain text immediately outside the selection directly
 * rather than reusing `italicMarkup`'s run-boundary logic.
 */
export function italicWrapMarkup(
	doc: ProseMirrorNode,
	from: number,
	to: number,
	preferredMarkup: string
): string {
	if (preferredMarkup === '*') return '*'

	const before = from > 0 ? doc.textBetween(from - 1, from) : undefined
	const after = to < doc.content.size ? doc.textBetween(to, to + 1) : undefined
	const intraword = isWordChar(before) || isWordChar(after)

	return intraword ? '*' : '_'
}
