import { italicMarkup } from '@/editor/italic-markup'
import type { MarkSerializerSide } from '@/editor/mark-serializer'
import type { MarkdownIt } from '@/editor/markdown-it-types'

/**
 * The `markdown` storage tiptap-markdown reads to serialize/parse italics.
 * `data-markup` (stamped by the `em_open` patch below) is otherwise the only
 * place the source marker (`_` or `*`) survives between markdown-it and
 * ProseMirror, so `parse.setup` re-attaches it to every `<em>` markdown-it
 * produces.
 */
export function italicMarkdownSpec() {
	return {
		serialize: {
			open: ((_state, mark, parent, index) =>
				italicMarkup(mark, parent, index, 'open')) satisfies MarkSerializerSide,
			close: ((_state, mark, parent, index) =>
				italicMarkup(
					mark,
					parent,
					index,
					'close'
				)) satisfies MarkSerializerSide,
			mixable: true,
			// No `expelEnclosingWhitespace`: it corrupts output with function
			// delimiters like ours.
		},
		parse: {
			setup(markdownit: MarkdownIt) {
				markdownit.renderer.rules.em_open = (tokens, idx) =>
					`<em data-markup="${tokens[idx].markup === '*' ? '*' : '_'}">`
			},
		},
	}
}
