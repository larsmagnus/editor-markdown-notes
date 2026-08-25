import type { Mark } from '@tiptap/core'

import { createDelimiterInputRule } from '@/editor/extensions/formatting/delimiter-input-rule'
import { createEnsureDelimitersPlugin } from '@/editor/extensions/formatting/ensure-delimiters-plugin'
import {
	removeClosingDelimiterOnDelete,
	removeOpeningDelimiterOnBackspace,
} from '@/editor/extensions/formatting/remove-delimiter-at-boundary'
import { PARSED_BY_MARKDOWN_IT } from '@/editor/extensions/markdown/mark-serializer'

/**
 * Turns a stock fixed-delimiter mark extension (bold's `**`, strike's `~~`)
 * into one whose delimiters are real, editable, caret-revealed text -
 * everything a delimited mark needs that doesn't depend on the specific
 * command name each mark exposes (`toggleBold` vs `toggleStrike`), which
 * stays the caller's own thin `addCommands` override (see `bold-extension.ts`).
 *
 * Supersedes the stock input rule entirely rather than adding to it - both
 * match the exact same trigger text, and whichever is checked first consumes
 * it, so leaving the stock one in the list would make this one dead code.
 * Paste is deliberately left on the stock paste rule (still consumes
 * delimiters into a bare mark): `ensure-delimiters-plugin.ts` re-adds them
 * afterward regardless of how a mark arrived with none, so a second,
 * paste-specific rewrite would duplicate work the safety net already covers.
 */
export function createDelimitedMarkExtension(
	base: Mark,
	{ delimiter, inputRegex }: { delimiter: string; inputRegex: RegExp }
): Mark {
	return base.extend({
		addStorage() {
			return {
				markdown: {
					// The delimiters are already real text carrying this mark (see
					// `wrap-selection-with-delimiter.ts`) - nothing left to
					// synthesize here, or they'd double up. `escape: false` is load-
					// bearing, not cosmetic: `prosemirror-markdown`'s default escaping
					// has no way to tell a coincidental double-asterisk in plain prose
					// apart from a real delimiter, and would otherwise write this
					// mark's own `**`/`~~` back out as `\*\*`/`\~\~` - syntax that
					// silently stops being a mark on the next load.
					serialize: { open: '', close: '', mixable: true, escape: false },
					parse: PARSED_BY_MARKDOWN_IT,
				},
			}
		},

		addKeyboardShortcuts() {
			return {
				...this.parent?.(),
				Backspace: () =>
					removeOpeningDelimiterOnBackspace(this.type, delimiter.length)(
						this.editor.state,
						this.editor.view.dispatch
					),
				Delete: () =>
					removeClosingDelimiterOnDelete(this.type, delimiter.length)(
						this.editor.state,
						this.editor.view.dispatch
					),
			}
		},

		addInputRules() {
			return [createDelimiterInputRule(this.type, inputRegex)]
		},

		addProseMirrorPlugins() {
			return [
				...(this.parent?.() ?? []),
				createEnsureDelimitersPlugin(this.type, delimiter),
			]
		},
	})
}
