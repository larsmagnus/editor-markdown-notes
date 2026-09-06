import type { Node as ProseMirrorNode, NodeType } from '@tiptap/pm/model'
import type { Command, EditorState, Transaction } from '@tiptap/pm/state'

import { canSetBlockType } from '@/editor/extensions/can-set-block-type'
import {
	headingMarkerLength,
	headingMarkerText,
	parseHeadingLevel,
} from '@/editor/extensions/heading/heading-marker'

type HeadingBlock = { pos: number; node: ProseMirrorNode }

/** Every heading/paragraph textblock the selection touches, outermost only. */
function blocksInSelection(
	state: EditorState,
	headingType: NodeType,
	paragraphType: NodeType
): HeadingBlock[] {
	const { $from, $to } = state.selection
	const range = $from.blockRange($to)
	if (!range) return []

	const blocks: HeadingBlock[] = []
	state.doc.nodesBetween(range.start, range.end, (node, pos) => {
		if (node.type !== headingType && node.type !== paragraphType) return
		blocks.push({ pos, node })
	})
	return blocks
}

/**
 * Whether every block can actually become `headingType` in place - a list
 * item's own content spec requires its first child to be a `paragraph`, so
 * toggling a heading on with the caret inside one would otherwise reach
 * `setNodeMarkup` and throw. Already-heading blocks trivially qualify (no
 * type change needed there).
 */
function everyBlockCanBecomeHeading(
	state: EditorState,
	blocks: HeadingBlock[],
	headingType: NodeType
): boolean {
	return blocks.every(({ pos, node }) => {
		if (node.type === headingType) return true
		return canSetBlockType(state.doc.resolve(pos + 1), headingType)
	})
}

/** Sets one block's type to `headingType`, inserting or replacing its marker. */
function applyHeading(
	tr: Transaction,
	{ pos, node }: HeadingBlock,
	headingType: NodeType,
	level: number
): void {
	const existing =
		node.type === headingType ? headingMarkerLength(node.textContent) : 0
	tr.insertText(headingMarkerText(level), pos + 1, pos + 1 + existing)
	tr.setNodeMarkup(pos, headingType)
}

/** Sets one heading block back to `paragraphType`, stripping its marker. */
function applyParagraph(
	tr: Transaction,
	{ pos, node }: HeadingBlock,
	paragraphType: NodeType
): void {
	const markerLength = headingMarkerLength(node.textContent)
	if (markerLength > 0) tr.delete(pos + 1, pos + 1 + markerLength)
	tr.setNodeMarkup(pos, paragraphType)
}

/**
 * Sets every textblock the selection touches to the given heading level,
 * inserting or replacing its literal marker text - level is no longer an
 * attribute (see `heading-extension.ts`), so setting it means writing the
 * marker itself rather than `setNode`'s usual `attrs` argument.
 */
export function createSetHeadingCommand(
	headingType: NodeType,
	paragraphType: NodeType,
	level: number
): Command {
	return (state, dispatch) => {
		const blocks = blocksInSelection(state, headingType, paragraphType)
		if (blocks.length === 0) return false
		if (!everyBlockCanBecomeHeading(state, blocks, headingType)) return false
		if (!dispatch) return true

		const tr = state.tr
		for (const block of blocks.reverse())
			applyHeading(tr, block, headingType, level)
		dispatch(tr)
		return true
	}
}

/**
 * Toggles every textblock the selection touches between the given heading
 * level and a paragraph: back to paragraph when every touched block is
 * already at that level, otherwise forward to the heading, replacing
 * whatever marker (if any) was already there. Blocks are rewritten in
 * *reverse* document order - the same reason the marker sync plugin is -
 * so replacing a later block's marker never shifts an earlier block's
 * already-read position.
 */
export function createToggleHeadingCommand(
	headingType: NodeType,
	paragraphType: NodeType,
	level: number
): Command {
	return (state, dispatch) => {
		const blocks = blocksInSelection(state, headingType, paragraphType)
		if (blocks.length === 0) return false

		const allAtLevel = blocks.every(
			({ node }) =>
				node.type === headingType &&
				parseHeadingLevel(node.textContent) === level
		)

		if (
			!allAtLevel &&
			!everyBlockCanBecomeHeading(state, blocks, headingType)
		) {
			return false
		}

		if (!dispatch) return true

		const tr = state.tr
		for (const block of blocks.reverse()) {
			if (allAtLevel) applyParagraph(tr, block, paragraphType)
			else applyHeading(tr, block, headingType, level)
		}
		dispatch(tr)
		return true
	}
}
