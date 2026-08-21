import { MarkdownSerializerState } from 'prosemirror-markdown'

import {
	backtickRuns,
	flankingAsteriskOffsets,
	hasFlankingAsteriskPartner,
	hasMatchingBacktickRun,
} from '@/editor/extensions/markdown/markdown-escape-partners'
import type { TableSerializerState } from '@/editor/extensions/table/table-extension'
import { isWordChar } from '@/lib/word-boundary'

let patched = false

/**
 * Patches `prosemirror-markdown`'s `esc()` - there's no serializer hook to
 * override it otherwise - so it only escapes a character when leaving it
 * bare could actually be reparsed as syntax. The default escapes every
 * `` ` ``, `*`, `\`, `~`, `[`, `]` unconditionally, so e.g. `## [Unreleased]`
 * comes back as `## \[Unreleased\]` and `~44kB` as `\~44kB`.
 *
 * - `[` only escaped when it would start a link reference definition
 *   (`[label]: destination`); `]` only before `(` or `[` (the only
 *   link/image risk).
 * - `~` only escaped next to another `~` (needs a `~~` run to mean anything).
 * - `` ` ``/`*` only escaped when a same-length backtick run / flanking
 *   asterisk partner exists elsewhere in the string - see
 *   `markdown-escape-partners.ts`.
 * - `_` keeps the base intraword exception; `\` always escapes.
 * - `|` only escaped inside a table row, where it would otherwise end the cell:
 *   a cell reading `Revenue | Growth` saved as two cells.
 *
 * `tiptap-markdown` builds its serializer state internally and exposes no
 * way to scope a custom `esc` to it, so this patches the shared
 * `prosemirror-markdown` prototype its subclass inherits from - process-wide
 * by necessity, not by accident. The `patched` guard just keeps re-imports
 * from reassigning the same function.
 */
export function patchMarkdownEscaping(): void {
	if (patched) return
	patched = true

	MarkdownSerializerState.prototype.esc = function (
		this: MarkdownSerializerState,
		str: string,
		startOfLine = false
	): string {
		const asteriskOffsets = flankingAsteriskOffsets(str)
		const runs = backtickRuns(str)

		const { inTable } = this as TableSerializerState

		let escaped = str.replace(
			/[`*\\~[\]_|]/g,
			(match: string, offset: number) => {
				switch (match) {
					case '|':
						return inTable ? '\\' + match : match
					case '_':
						return isWordChar(str[offset - 1]) && isWordChar(str[offset + 1])
							? match
							: '\\' + match
					case '[':
						return startOfLine && offset === 0 && /^\[[^\]]+\]:\s*\S/.test(str)
							? '\\' + match
							: match
					case ']':
						return str[offset + 1] === '(' || str[offset + 1] === '['
							? '\\' + match
							: match
					case '~':
						return str[offset - 1] === '~' || str[offset + 1] === '~'
							? '\\' + match
							: match
					case '`':
						return hasMatchingBacktickRun(runs, offset) ? '\\' + match : match
					case '*':
						return hasFlankingAsteriskPartner(asteriskOffsets, offset)
							? '\\' + match
							: match
					default:
						return '\\' + match
				}
			}
		)
		if (startOfLine) {
			escaped = escaped
				.replace(/^(\+[ ]|[-*>])/, '\\$&')
				.replace(/^(\s*)(#{1,6})(\s|$)/, '$1\\$2$3')
				.replace(/^(\s*\d+)\.\s/, '$1\\. ')
		}
		if (this.options.escapeExtraCharacters) {
			escaped = escaped.replace(this.options.escapeExtraCharacters, '\\$&')
		}
		return escaped
	}
}
