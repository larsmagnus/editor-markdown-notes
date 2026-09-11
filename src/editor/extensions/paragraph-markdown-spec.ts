import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { defaultMarkdownSerializer } from 'prosemirror-markdown'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

// Only reads `state`/`node` at runtime, typed with `parent`/`index` because
// `MarkdownSerializer['nodes']` is one shared shape for every node type.
const stockParagraphSerialize = defaultMarkdownSerializer.nodes.paragraph as (
	state: MarkdownSerializerState,
	node: ProseMirrorNode
) => void

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
 * Scoped to top-level paragraphs with real content still ahead: a list
 * item's or blockquote's empty paragraph is for that container to manage, not
 * an author's deliberate blank line, and a *trailing* run is the "cursor
 * rests here" artifact commands like outdent leave behind - never flushed,
 * so it must stay silent. `parent` is absent for a bare fragment (copying a
 * table selection), which never needs either branch.
 *
 * `state.write()` rather than the internal `flushClose` it wraps - the public
 * API triggers the same default flush.
 */
export function paragraphMarkdownSerialize(
	state: MarkdownSerializerState,
	node: ProseMirrorNode,
	parent: ProseMirrorNode | undefined,
	index: number
): void {
	const preserveAsBlankLine =
		node.content.size === 0 &&
		parent?.type?.name === 'doc' &&
		hasLaterContent(parent, index)

	if (!preserveAsBlankLine) {
		stockParagraphSerialize(state, node)
		return
	}

	state.write()
	state.closeBlock(node)
}
