import Strike, { inputRegex } from '@tiptap/extension-strike'

import { createToggleMarkCommand } from '@/editor/extensions/formatting/create-toggle-mark-command'
import { createDelimitedMarkExtension } from '@/editor/extensions/formatting/delimited-mark-extension'
import { fixedDelimiter } from '@/editor/extensions/formatting/delimiter-spec'

const DELIMITER = '~~'

/**
 * `~~strike~~` with real, caret-revealed delimiter text - see
 * `delimited-mark-extension.ts` for everything shared with `bold`.
 */
export const StrikeExtension = createDelimitedMarkExtension(Strike, {
	delimiterLength: DELIMITER.length,
	ensureSpec: fixedDelimiter(DELIMITER),
	inputRegex,
	// Nests inside bold - see `uniform-outer-marks.ts`.
	outerMarkNames: ['bold'],
}).extend({
	addCommands() {
		return {
			...this.parent?.(),
			toggleStrike: () =>
				createToggleMarkCommand(this.type, DELIMITER, this.name),
		}
	},
})
