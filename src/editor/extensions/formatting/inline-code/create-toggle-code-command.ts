import type { CommandProps } from '@tiptap/core'
import type { MarkType } from '@tiptap/pm/model'

import { inlineCodeDelimiterSpec } from '@/editor/extensions/formatting/inline-code/inline-code-delimiter-spec'
import { inlineCodeFenceText } from '@/editor/extensions/formatting/inline-code/inline-code-fence-text'
import { toggleDelimitedMark } from '@/editor/extensions/formatting/toggle-delimited-mark'

/**
 * `toggleCode`'s body - separate from `create-toggle-mark-command.ts`
 * because inline code's fence isn't a constant: wrapping a fresh selection
 * needs `inlineCodeFenceText` to pick the shortest backtick run not already
 * present in the selected text itself, where bold/strike's fixed `**`/`~~`
 * never varies.
 */
export function createToggleCodeCommand(markType: MarkType, markName: string) {
	return ({ state, dispatch, chain }: CommandProps): boolean => {
		if (!state.selection.empty) {
			const { from, to } = state.selection
			const wrapDelimiters = inlineCodeFenceText(
				state.doc.textBetween(from, to)
			)
			if (
				toggleDelimitedMark(
					markType,
					inlineCodeDelimiterSpec(),
					wrapDelimiters
				)(state, dispatch)
			) {
				return true
			}
		}

		return chain().toggleMark(markName).run()
	}
}
