import type { CommandProps } from '@tiptap/core'

import { unwrapCodeBlockAtFenceStart } from '@/editor/extensions/code-block/unwrap-code-block'

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
 * synthesizes. `unwrapCodeBlockAtFenceStart` already does exactly this for
 * Backspace, so routing the toggle through it keeps one implementation of
 * "drop the fences, keep the code". Turning a block *on* is unchanged.
 */
export function createToggleCodeBlockCommand(
	typeName: string,
	parentToggle: ToggleCodeBlock | undefined
): ToggleCodeBlock {
	return (attributes) => (props) => {
		if (!props.editor.isActive(typeName)) {
			return Boolean(parentToggle?.(attributes)(props))
		}

		return unwrapCodeBlockAtFenceStart(typeName, { anywhere: true })(
			props.state,
			props.dispatch
		)
	}
}
