import type { CommandProps } from '@tiptap/core'

import { unwrapConstructAtCaret } from '@/editor/extensions/block-marker/unwrap-at-caret'

/**
 * The stock command's own signature. `language` is no longer an attribute of
 * this schema (see `code-block-extension.ts`), but the inherited command still
 * declares it, and the wrapper has to stay assignable to what it wraps.
 */
type ToggleCodeBlock = (attributes?: {
	language: string
}) => (props: CommandProps) => boolean

/**
 * Toggling a code block off leaves its fence lines behind as literal
 * paragraph text - they are real content now, not markup the serializer
 * synthesizes. Routing the toggle through the block's own `unwrap` is what
 * makes it land on the same result as deleting a fence by hand. Turning a
 * block *on* is unchanged.
 */
export function createToggleCodeBlockCommand(
	typeName: string,
	parentToggle: ToggleCodeBlock | undefined
): ToggleCodeBlock {
	return (attributes) => (props) => {
		if (!props.editor.isActive(typeName)) {
			return Boolean(parentToggle?.(attributes)(props))
		}

		return unwrapConstructAtCaret(typeName)(props.state, props.dispatch)
	}
}
