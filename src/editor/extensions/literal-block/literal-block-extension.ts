import { mergeAttributes, Node } from '@tiptap/core'

import { serializeVerbatim } from '#src/editor/extensions/markdown/serialize-verbatim'

/**
 * A block shown and saved exactly as written, for markdown this editor cannot
 * represent without changing it - a construct its schema has no node for, or
 * one whose serialization would read back as something else. Every character
 * is plain, editable text; nothing is hidden, escaped or normalized.
 *
 * Only ever created on load (`parse-note-document.ts`), never by an edit, and
 * never turned back into structure while the note is open: the next load
 * parses the text afresh, so a fix the author types here shows up formatted
 * then. `code: true` is what keeps marks, input rules and escaping out of it,
 * and makes Enter insert a newline rather than split it.
 */
export const LiteralBlockExtension = Node.create({
	name: 'literalBlock',
	group: 'block',
	content: 'text*',
	marks: '',
	code: true,
	defining: true,

	parseHTML() {
		return [{ tag: 'p[data-type="literal-block"]', preserveWhitespace: 'full' }]
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'p',
			mergeAttributes(HTMLAttributes, { 'data-type': 'literal-block' }),
			0,
		]
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
