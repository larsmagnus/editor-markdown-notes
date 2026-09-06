import type { Mark } from '@tiptap/core'

import { createDelimiterInputRule } from '@/editor/extensions/formatting/delimiter-input-rule'
import { IDENTITY_DELIMITER_SERIALIZE } from '@/editor/extensions/formatting/delimiter-spec'
import type {
	DelimiterMarkdownSerialize,
	DelimiterSpec,
} from '@/editor/extensions/formatting/delimiter-spec'
import { createEnsureDelimitersPlugin } from '@/editor/extensions/formatting/ensure-delimiters-plugin'
import {
	removeDelimiterOnBackspace,
	removeDelimiterOnDelete,
} from '@/editor/extensions/formatting/remove-delimiter-at-boundary'
import { PARSED_BY_MARKDOWN_IT } from '@/editor/extensions/markdown/mark-serializer'

/**
 * Turns a stock mark extension into one whose delimiters are real, editable,
 * caret-revealed text. Everything that does not depend on the command name a
 * mark exposes; that stays the caller's own `addCommands` override.
 *
 * Supersedes the stock input rule rather than adding to it - both match the
 * same trigger and the first checked consumes it. Paste stays on the stock
 * rule: `ensure-delimiters-plugin.ts` re-adds delimiters however a mark
 * arrived without them.
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
		/** Identity by default - the delimiter is already real, marked text. */
		serialize?: DelimiterMarkdownSerialize
	}
): Mark {
	return base.extend({
		// The closing delimiter is real mark-carrying text, so the range genuinely
		// ends there. The default `inclusive: true` would extend it into whatever
		// is typed next.
		inclusive: false,

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
					removeDelimiterOnBackspace(this.type, ensureSpec)(
						this.editor.state,
						this.editor.view.dispatch
					),
				Delete: () =>
					removeDelimiterOnDelete(this.type, ensureSpec)(
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
