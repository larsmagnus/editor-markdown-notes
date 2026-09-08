import Strike, { inputRegex } from '@tiptap/extension-strike'

import { createToggleMarkCommand } from '#src/editor/extensions/formatting/create-toggle-mark-command'
import { createDelimitedMarkExtension } from '#src/editor/extensions/formatting/delimited-mark-extension'
import { fixedDelimiter } from '#src/editor/extensions/formatting/delimiter-spec'

const DELIMITER = '~~'

/**
 * `~~strike~~` with real, caret-revealed delimiter text - see
 * `delimited-mark-extension.ts` for everything shared with `bold`.
 */
export const StrikeExtension = createDelimitedMarkExtension(Strike, {
	ensureSpec: fixedDelimiter(DELIMITER),
	inputRegex,
	// Nests inside link and bold - see `uniform-outer-marks.ts`.
	outerMarkNames: ['link', 'bold'],
}).extend({
	addCommands() {
		return {
			...this.parent?.(),
			toggleStrike: () =>
				createToggleMarkCommand(this.type, DELIMITER, this.name),
		}
	},
})
