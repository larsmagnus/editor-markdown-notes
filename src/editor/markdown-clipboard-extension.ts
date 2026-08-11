import type { Fragment } from '@tiptap/pm/model'
import { DOMParser } from '@tiptap/pm/model'
import type { Slice } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { isInTable } from '@tiptap/pm/tables'
import { Extension } from '@tiptap/react'

import { looksLikeBlockMarkdown } from '@/editor/looks-like-block-markdown'
import { flattenPastedCells } from '@/editor/table/flatten-pasted-cells'
import { closeTableSlice } from '@/editor/table/slice'

/**
 * Makes the clipboard speak markdown in both directions.
 *
 * `tiptap-markdown` ships something similar as `MarkdownClipboard`, off by
 * default, and its parser hardcodes three choices this one has to make itself:
 * it parses every paste, always as inline, and always in the caret's context -
 * so a pasted table is parsed as if it had to fit inside the paragraph it lands
 * in, and is dropped. Named apart from that one, which is registered either
 * way.
 */

// `tiptap-markdown` builds both in `onBeforeCreate` but types neither.
declare module 'tiptap-markdown' {
	interface MarkdownStorage {
		parser: { parse: (content: string) => string }
		serializer: { serialize: (content: Fragment) => string }
	}
}

export const MarkdownClipboard = Extension.create({
	name: 'clipboardMarkdown',

	addProseMirrorPlugins() {
		const { editor } = this

		return [
			new Plugin({
				key: new PluginKey('clipboardMarkdown'),
				props: {
					// Without this the plain-text flavour is ProseMirror's
					// `textBetween`, which stacks a table's cells as loose lines.
					clipboardTextSerializer: (slice) => {
						const content = closeTableSlice(slice, editor.schema) ?? slice

						return editor.storage.markdown.serializer.serialize(content.content)
					},

					clipboardTextParser: (text, _context, plainText) => {
						// ProseMirror falls back to its own line-by-line parse when this
						// hook produces nothing, though it types the return as a slice.
						const decline = null as unknown as Slice

						// Shift-paste asked for the characters, not the markup, and so did
						// anything that only looks like prose.
						if (plainText || !looksLikeBlockMarkdown(text)) return decline

						const container = document.createElement('div')
						container.innerHTML = editor.storage.markdown.parser.parse(text)

						// Parsed without the caret's context, which would reject the block
						// structure that got the text this far.
						return DOMParser.fromSchema(editor.schema).parseSlice(container, {
							preserveWhitespace: true,
						})
					},

					transformPastedHTML: flattenPastedCells,

					transformPasted: (slice, view) => {
						if (isInTable(view.state)) return slice

						return closeTableSlice(slice, view.state.schema) ?? slice
					},
				},
			}),
		]
	},
})
