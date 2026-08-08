import type { Mark, Node as ProseMirrorNode } from 'prosemirror-model'

import { isWordChar } from '@/editor/word-boundary'

function charBefore(
	parent: ProseMirrorNode,
	index: number
): string | undefined {
	if (index <= 0) return undefined
	const sibling = parent.child(index - 1)
	return sibling.isText && sibling.text ? sibling.text.at(-1) : undefined
}

function charAfter(parent: ProseMirrorNode, index: number): string | undefined {
	if (index >= parent.childCount) return undefined
	const sibling = parent.child(index)
	return sibling.isText && sibling.text ? sibling.text.at(0) : undefined
}

function italicRunEnd(
	mark: Mark,
	parent: ProseMirrorNode,
	start: number
): number {
	let end = start
	while (end < parent.childCount && mark.isInSet(parent.child(end).marks)) end++
	return end
}

function italicRunStart(
	mark: Mark,
	parent: ProseMirrorNode,
	end: number
): number {
	let start = end
	while (start > 0 && mark.isInSet(parent.child(start - 1).marks)) start--
	return start
}

// CommonMark disallows `_` opening/closing emphasis mid-word, so fall back to
// `*` when either edge of the run is intraword. Both edges must agree, or
// we'd emit an unparseable `_word*`.
export function italicMarkup(
	mark: Mark,
	parent: ProseMirrorNode,
	index: number,
	edge: 'open' | 'close'
): string {
	if (mark.attrs.markup === '*') return '*'

	const [start, end] =
		edge === 'open'
			? [index, italicRunEnd(mark, parent, index)]
			: [italicRunStart(mark, parent, index), index]

	const before = charBefore(parent, start)
	const after = charAfter(parent, end)
	const intraword = isWordChar(before) || isWordChar(after)

	return intraword ? '*' : '_'
}
