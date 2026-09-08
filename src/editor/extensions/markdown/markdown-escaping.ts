import { MarkdownSerializerState } from 'prosemirror-markdown'

import type { HeadingSerializerState } from '#src/editor/extensions/heading/heading-extension'
import type { LinkSerializerState } from '#src/editor/extensions/link/link-markdown-spec'
import {
	backtickRuns,
	flankingAsteriskOffsets,
	hasFlankingAsteriskPartner,
	hasMatchingBacktickRun,
} from '#src/editor/extensions/markdown/markdown-escape-partners'
import type { TableSerializerState } from '#src/editor/extensions/table/table-extension'
import { isWordChar } from '#src/lib/word-boundary'

let patched = false

/**
 * Patches `prosemirror-markdown`'s `esc()` so it escapes a character only when
 * leaving it bare could be reparsed as syntax. The default escapes every
 * `` ` ``, `*`, `\`, `~`, `[`, `]` unconditionally, turning `## [Unreleased]`
 * into `## \[Unreleased\]` and `~44kB` into `\~44kB`.
 *
 * - `[` only where it would start a link reference definition; `]` only before
 *   `(` or `[`.
 * - `~` only next to another `~`, which a `~~` run needs to mean anything.
 * - `` ` ``/`*` only where a partner run exists elsewhere in the string.
 * - `_` keeps the base intraword exception; `\` always escapes.
 * - `|` only inside a table row, where a cell reading `Revenue | Growth` would
 *   otherwise save as two cells.
 *
 * `tiptap-markdown` builds its serializer state internally with no way to
 * scope a custom `esc` to it, so this patches the shared prototype its
 * subclass inherits from - process-wide by necessity.
 */
export function patchMarkdownEscaping(): void {
	if (patched) return
	patched = true

	MarkdownSerializerState.prototype.esc = function (
		this: MarkdownSerializerState,
		str: string,
		startOfLine = false
	): string {
		// A link's own delimiters are real marked text, and a link cannot use
		// `escape: false` to protect them (see `link-markdown-spec.ts`).
		if ((this as LinkSerializerState).inLink) return str

		const asteriskOffsets = flankingAsteriskOffsets(str)
		const runs = backtickRuns(str)

		const { inTable } = this as TableSerializerState
		const { inHeading } = this as HeadingSerializerState

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
			escaped = escaped.replace(/^(\+[ ]|[-*>])/, '\\$&')
			// A heading's leading `#`s are real content, not prose that starts with
			// one - escaping them would corrupt every heading on save.
			if (!inHeading) {
				escaped = escaped.replace(/^(\s*)(#{1,6})(\s|$)/, '$1\\$2$3')
			}
			escaped = escaped.replace(/^(\s*\d+)\.\s/, '$1\\. ')
		}
		if (this.options.escapeExtraCharacters) {
			escaped = escaped.replace(this.options.escapeExtraCharacters, '\\$&')
		}
		return escaped
	}
}
