import { mergeAttributes, Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { detectFrontmatter } from '@/editor/extensions/frontmatter/detect'
import { isAtFrontmatterEdge } from '@/editor/extensions/frontmatter/frontmatter-edge-keymap'
import { FrontmatterView } from '@/editor/extensions/frontmatter/frontmatter-view'
import { serializeVerbatim } from '@/editor/extensions/markdown/serialize-verbatim'

/**
 * The note's YAML frontmatter, as a real node at the start of the document
 * rather than separate React state.
 *
 * `code: true` gives it `codeBlock`'s text-with-embedded-newlines editing
 * model: marks disabled, Enter inserting `\n` rather than splitting the node.
 * `isolating` keeps it from merging into the paragraph after it.
 *
 * markdown-it never sees a `---`: parsing stays the regex-based
 * `splitFrontmatter`, and the node is inserted after `setContent` runs, so
 * `parse` is an empty stub nothing ever reaches.
 */
export const Frontmatter = Node.create({
	name: 'frontmatter',
	content: 'text*',
	marks: '',
	code: true,
	defining: true,
	isolating: true,

	parseHTML() {
		return [{ tag: 'pre[data-type="frontmatter"]' }]
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'pre',
			mergeAttributes(HTMLAttributes, { 'data-type': 'frontmatter' }),
			['code', 0],
		]
	},

	addNodeView() {
		return ReactNodeViewRenderer(FrontmatterView)
	},

	addKeyboardShortcuts() {
		return {
			ArrowUp: () => isAtFrontmatterEdge(this.editor, 'up'),
			ArrowLeft: () => isAtFrontmatterEdge(this.editor, 'left'),
		}
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey('frontmatterDetect'),
				appendTransaction: (_transactions, _oldState, newState) =>
					detectFrontmatter(newState) ?? undefined,
			}),
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
