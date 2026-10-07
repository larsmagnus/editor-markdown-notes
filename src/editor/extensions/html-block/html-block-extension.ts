import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { HtmlBlockView } from '#src/editor/extensions/html-block/html-block-view'
import { serializeVerbatim } from '#src/editor/extensions/markdown/serialize-verbatim'

/**
 * A block of raw HTML, holding its source exactly as written and saving it
 * back verbatim. `code: true` gives it the same editing model as a code block
 * or `mdxBlock`: no marks, Enter inserts a newline. Drawn as HTML by its node
 * view while the caret is elsewhere.
 *
 * Only ever created on load (`parse-body-pieces.ts`), from a block markdown-it
 * read as HTML - left to the browser, that HTML was parsed into elements the
 * schema has no node for and dropped, deleting it from the file on save.
 */
export const HtmlBlockExtension = Node.create({
	name: 'htmlBlock',
	group: 'block',
	content: 'text*',
	marks: '',
	code: true,
	defining: true,

	parseHTML() {
		return [{ tag: 'pre[data-type="html-block"]', preserveWhitespace: 'full' }]
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'pre',
			mergeAttributes(HTMLAttributes, { 'data-type': 'html-block' }),
			0,
		]
	},

	addNodeView() {
		return ReactNodeViewRenderer(HtmlBlockView)
	},

	addStorage() {
		return {
			markdown: {
				serialize: serializeVerbatim,
				parse: {},
			},
		}
	},
})
