import type { Mark } from '@tiptap/core'

import { createDelimiterInputRule } from '@/editor/extensions/formatting/delimiter-input-rule'
import { IDENTITY_DELIMITER_SERIALIZE } from '@/editor/extensions/formatting/delimiter-spec'
import type {
	DelimiterMarkdownSerialize,
	DelimiterSpec,
} from '@/editor/extensions/formatting/delimiter-spec'
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
	{
		ensureSpec,
		inputRegex,
		outerMarkNames,
		serialize = IDENTITY_DELIMITER_SERIALIZE,
	}: {
		ensureSpec: DelimiterSpec
		/**
		 * Omit when the caller provides its own `addInputRules` in a further
		 * `.extend()` - italic needs one rule per markup variant (`*`/`_`) with
		 * its own attributes, which a single regex can't express.
		 */
		inputRegex?: RegExp
		/** See `uniform-outer-marks.ts` - names of delimited marks that outrank this one. */
		outerMarkNames?: string[]
		/**
		 * Defaults to identity (the common case: the delimiter is already real,
		 * marked text, nothing left to synthesize). A link needs its own - see
		 * `link-markdown-spec.ts` for why one delimited mark can't stay identity.
		 */
		serialize?: DelimiterMarkdownSerialize
	}
): Mark {
	return base.extend({
		addStorage() {
			return {
				markdown: {
					serialize,
					parse: PARSED_BY_MARKDOWN_IT,
				},
			}
		},

		addKeyboardShortcuts() {
			return {
				...this.parent?.(),
				Backspace: () =>
					removeOpeningDelimiterOnBackspace(this.type, ensureSpec)(
						this.editor.state,
						this.editor.view.dispatch
					),
				Delete: () =>
					removeClosingDelimiterOnDelete(this.type, ensureSpec)(
						this.editor.state,
						this.editor.view.dispatch
					),
			}
		},

		addInputRules() {
			return inputRegex ? [createDelimiterInputRule(this.type, inputRegex)] : []
		},

		addProseMirrorPlugins() {
			return [
				...(this.parent?.() ?? []),
				createEnsureDelimitersPlugin(this.type, ensureSpec, outerMarkNames),
			]
		},
	})
}
