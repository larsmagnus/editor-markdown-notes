import Bold, { starInputRegex } from '@tiptap/extension-bold'

import { createToggleMarkCommand } from '@/editor/extensions/formatting/create-toggle-mark-command'
import { createDelimitedMarkExtension } from '@/editor/extensions/formatting/delimited-mark-extension'
import { fixedDelimiter } from '@/editor/extensions/formatting/delimiter-spec'

const DELIMITER = '**'

/**
 * `**bold**` with real, caret-revealed delimiter text - see
 * `delimited-mark-extension.ts` for everything shared with `strike`.
 */
export const BoldExtension = createDelimitedMarkExtension(Bold, {
	delimiterLength: DELIMITER.length,
	ensureSpec: fixedDelimiter(DELIMITER),
	inputRegex: starInputRegex,
}).extend({
	addCommands() {
		return {
			...this.parent?.(),
			toggleBold: () =>
				createToggleMarkCommand(this.type, DELIMITER, this.name),
		}
	},
})
