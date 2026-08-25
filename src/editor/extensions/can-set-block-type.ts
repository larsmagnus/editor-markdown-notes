import type { NodeType, ResolvedPos } from '@tiptap/pm/model'

/**
 * Whether the textblock `$start` resolves into can become `type` in place -
 * shared by every input rule that converts a block's type without deleting
 * the text that triggered it (`fence-input-rule.ts`, `heading-input-rule.ts`).
 */
export function canSetBlockType($start: ResolvedPos, type: NodeType): boolean {
	return $start
		.node(-1)
		.canReplaceWith($start.index(-1), $start.indexAfter(-1), type)
}
