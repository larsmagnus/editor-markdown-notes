import type { Command } from '@tiptap/pm/state'

import { fenceCode } from '@/editor/extensions/code-block/code-fence'

/**
 * Backspacing at the very start of a code block's fence line unwraps the
 * block into a plain paragraph holding its code, fences dropped - the same
 * "delete the syntax, keep the content" mechanic as everywhere else in the
 * reveal work. `$from.parentOffset === 0` already means "start of the
 * opening fence line" once fence text is the first thing in the block's
 * content, so this needs no visual-line check the way blocked-at-the-top
 * commands elsewhere in the editor do.
 */
export function unwrapCodeBlockAtFenceStart(
	codeBlockTypeName: string
): Command {
	return (state, dispatch) => {
		const { selection } = state
		if (!selection.empty) return false

		const { $from } = selection
		if ($from.parent.type.name !== codeBlockTypeName) return false
		if ($from.parentOffset !== 0) return false

		const paragraphType = state.schema.nodes.paragraph
		if (!paragraphType) return false

		const code = fenceCode($from.parent.textContent)
		const content = code ? state.schema.text(code) : undefined

		if (dispatch) {
			dispatch(
				state.tr.replaceWith(
					$from.before(),
					$from.after(),
					paragraphType.create(null, content)
				)
			)
		}
		return true
	}
}
