import CodeMark from '@tiptap/extension-code'

import { createDelimitedMarkExtension } from '@/editor/extensions/formatting/delimited-mark-extension'
import { createToggleCodeCommand } from '@/editor/extensions/formatting/inline-code/create-toggle-code-command'
import { inlineCodeDelimiterSpec } from '@/editor/extensions/formatting/inline-code/inline-code-delimiter-spec'

/** A single backtick, with a delimited text span captured as the whole match. */
const CODE_INPUT_REGEX = /(`[^`]+`)$/

/**
 * `` `code` `` with real, caret-revealed delimiter text - see
 * `delimited-mark-extension.ts`. Unlike bold/strike/italic, the fence isn't
 * a constant: `inline-code-delimiter-spec.ts`/`inline-code-fence-text.ts`
 * choose the shortest backtick run not already present in the code's own
 * content, the same rule CommonMark backtick code spans use.
 *
 * StarterKit's copy excludes every other mark (`excludes: '_'`), so a code
 * span inside a bold run drops the bold mark and re-serializes as two
 * separate bold runs around unstyled code. Letting marks coexist keeps one
 * continuous run - but registration order then decides nesting (schema
 * mark-rank, not source order), so this must come after any mark that
 * should wrap around it; see `extensions.ts`.
 */
export const CodeExtension = createDelimitedMarkExtension(
	CodeMark.extend({ excludes: '' }),
	{
		ensureSpec: inlineCodeDelimiterSpec(),
		inputRegex: CODE_INPUT_REGEX,
		// Nests inside bold, strike, and italic - see `uniform-outer-marks.ts`.
		outerMarkNames: ['link', 'bold', 'strike', 'italic'],
	}
).extend({
	addCommands() {
		return {
			...this.parent?.(),
			toggleCode: () => createToggleCodeCommand(this.type, this.name),
		}
	},
})
