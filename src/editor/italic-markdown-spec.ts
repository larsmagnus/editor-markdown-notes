import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Mark, Node as ProseMirrorNode } from 'prosemirror-model'

import { italicMarkup } from '@/editor/italic-markup'
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
			open: (
				_state: MarkdownSerializerState,
				mark: Mark,
				parent: ProseMirrorNode,
				index: number
			) => italicMarkup(mark, parent, index, 'open'),
			close: (
				_state: MarkdownSerializerState,
				mark: Mark,
				parent: ProseMirrorNode,
				index: number
			) => italicMarkup(mark, parent, index, 'close'),
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
