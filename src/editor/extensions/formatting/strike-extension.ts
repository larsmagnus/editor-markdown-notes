import Strike, { inputRegex } from '@tiptap/extension-strike'

import { createToggleMarkCommand } from '@/editor/extensions/formatting/create-toggle-mark-command'
import { createDelimitedMarkExtension } from '@/editor/extensions/formatting/delimited-mark-extension'

const DELIMITER = '~~'

/**
 * `~~strike~~` with real, caret-revealed delimiter text - see
 * `delimited-mark-extension.ts` for everything shared with `bold`.
 */
export const StrikeExtension = createDelimitedMarkExtension(Strike, {
	delimiter: DELIMITER,
	inputRegex,
}).extend({
	addCommands() {
		return {
			...this.parent?.(),
			toggleStrike: () =>
				createToggleMarkCommand(this.type, DELIMITER, this.name),
		}
	},
})
