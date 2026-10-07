import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { defaultMarkdownSerializer } from 'prosemirror-markdown'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

// Only reads `state`/`node` at runtime, typed with `parent`/`index` because
// `MarkdownSerializer['nodes']` is one shared shape for every node type.
const stockParagraphSerialize = defaultMarkdownSerializer.nodes.paragraph as (
	state: MarkdownSerializerState,
	node: ProseMirrorNode
) => void

type FlushableState = MarkdownSerializerState & { flushClose(): void }

/** Whether a later sibling has real content - a trailing run of empty
 *  paragraphs must stay silent as a whole, not just its last member. */
function hasLaterContent(parent: ProseMirrorNode, index: number): boolean {
	for (let i = index + 1; i < parent.childCount; i++) {
		if (parent.child(i).content.size > 0) return true
	}
	return false
}

/**
 * The stock serializer's `closeBlock` *overwrites* `state.closed` rather than
 * flushing it, so an empty paragraph's pending close is silently dropped the
 * moment the next one replaces it - any number of blank lines an author typed
 * always round-trips as exactly one. Flushing this paragraph's own gap right
 * away, instead of leaving it for `closeBlock` to discard, makes each empty
 * paragraph contribute the blank line it stands for.
 *
 * Inside a blockquote or list item too - the author typed those blank lines
 * there as much as anywhere. Only paragraphs with real content still ahead:
 * a *trailing* run is the "cursor rests here" artifact commands like outdent
 * leave behind - never flushed, so it must stay silent. `parent` is absent
 * for a bare fragment (copying a table selection), which never needs either
 * branch.
 *
 * The internal `flushClose` rather than the public `write()` that wraps it:
 * `write()` also starts the next line with the container's prefix, which in
 * a blockquote left a stray `> ` line beside every blank one.
 */
export function paragraphMarkdownSerialize(
	state: MarkdownSerializerState,
	node: ProseMirrorNode,
	parent: ProseMirrorNode | undefined,
	index: number
): void {
	const preserveAsBlankLine =
		node.content.size === 0 &&
		parent !== undefined &&
		hasLaterContent(parent, index)

	if (!preserveAsBlankLine) {
		stockParagraphSerialize(state, node)
		return
	}

	;(state as FlushableState).flushClose()
	state.closeBlock(node)
}
