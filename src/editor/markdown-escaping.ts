import { MarkdownSerializerState } from 'prosemirror-markdown'

/**
 * Patches `prosemirror-markdown`'s `esc()` - there's no serializer hook to
 * override it otherwise - so it only escapes a character when leaving it
 * bare could actually be reparsed as syntax. The default escapes every
 * `` ` ``, `*`, `\`, `~`, `[`, `]` unconditionally, so e.g. `## [Unreleased]`
 * comes back as `## \[Unreleased\]` and `~44kB` as `\~44kB`.
 *
 * - `[` never escaped; `]` only before `(` or `[` (the only link/image risk).
 * - `~` only escaped next to another `~` (needs a `~~` run to mean anything).
 * - `` ` ``/`*` only escaped when a partner exists elsewhere in the run
 *   (`*` also only when flanking non-whitespace).
 * - `_` keeps the base intraword exception; `\` always escapes.
 */
export function patchMarkdownEscaping(): void {
	MarkdownSerializerState.prototype.esc = function (
		this: MarkdownSerializerState,
		str: string,
		startOfLine = false
	): string {
		let escaped = str.replace(
			/[`*\\~[\]_]/g,
			(match: string, offset: number) => {
				switch (match) {
					case '_':
						return offset > 0 &&
							offset + 1 < str.length &&
							/\w/.test(str[offset - 1]) &&
							/\w/.test(str[offset + 1])
							? match
							: '\\' + match
					case '[':
						return match
					case ']':
						return str[offset + 1] === '(' || str[offset + 1] === '['
							? '\\' + match
							: match
					case '~':
						return str[offset - 1] === '~' || str[offset + 1] === '~'
							? '\\' + match
							: match
					case '`':
						return str.slice(0, offset).includes('`') ||
							str.slice(offset + 1).includes('`')
							? '\\' + match
							: match
					case '*': {
						const flanking =
							(offset + 1 < str.length && !/\s/.test(str[offset + 1])) ||
							(offset > 0 && !/\s/.test(str[offset - 1]))
						const hasPartner =
							str.slice(0, offset).includes('*') ||
							str.slice(offset + 1).includes('*')
						return flanking && hasPartner ? '\\' + match : match
					}
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
