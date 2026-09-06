import { IDENTITY_DELIMITER_SERIALIZE } from '@/editor/extensions/formatting/delimiter-spec'
import type { MarkdownIt } from '@/editor/extensions/markdown/markdown-it-types'

/**
 * The `markdown` storage tiptap-markdown reads to serialize/parse italics.
 * The delimiter is already real text carrying the mark (see
 * `delimited-mark-extension.ts`) - nothing left to synthesize at serialize
 * time, or it would double up; `escape: false` keeps `prosemirror-markdown`'s
 * default escaping from mangling a literal `_`/`*` into `\_`/`\*`.
 *
 * `data-markup` (stamped by the `em_open` patch below) is the only place the
 * source marker survives between markdown-it and ProseMirror - markdown-it's
 * own HTML strips it, same as it strips `**`/`~~` - so `ensure-delimiters-
 * plugin.ts` (via `italic-delimiter-spec.ts`, which reads `data-markup` off
 * the `markup` attribute `parse.setup` re-attaches here) is what reconstructs
 * the literal character on the next real transaction.
 */
export function italicMarkdownSpec() {
	return {
		serialize: IDENTITY_DELIMITER_SERIALIZE,
		parse: {
			setup(markdownit: MarkdownIt) {
				markdownit.renderer.rules.em_open = (tokens, idx) =>
					`<em data-markup="${tokens[idx].markup === '*' ? '*' : '_'}">`
			},
		},
	}
}
