import type { CommandProps } from '@tiptap/core'
import type { MarkType } from '@tiptap/pm/model'

import { toggleDelimitedMark } from '@/editor/extensions/formatting/toggle-delimited-mark'

/**
 * The body every delimited mark's `toggleXxx` command shares - only the
 * command's own name differs per mark (`toggleBold`, `toggleStrike`, ...),
 * which is why this returns the function rather than the whole
 * `addCommands` object: TipTap's typed `Commands` interface needs each mark's
 * command as its own literal property key, not one produced generically.
 */
export function createToggleMarkCommand(
	markType: MarkType,
	delimiter: string,
	markName: string,
	attrs?: Record<string, unknown>
) {
	return ({ state, dispatch, chain }: CommandProps): boolean => {
		if (toggleDelimitedMark(markType, delimiter, attrs)(state, dispatch)) {
			return true
		}
		// Empty or mixed selection: no delimiter-aware move applies - fall back
		// to the stock toggle, which `ensure-delimiters-plugin.ts` keeps honest
		// about its own missing delimiters afterward.
		return chain().toggleMark(markName, attrs).run()
	}
}
