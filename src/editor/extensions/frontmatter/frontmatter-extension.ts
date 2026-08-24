import { mergeAttributes, Node } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import { detectFrontmatter } from '@/editor/extensions/frontmatter/detect'
import { isAtFrontmatterEdge } from '@/editor/extensions/frontmatter/frontmatter-edge-keymap'
import { FrontmatterView } from '@/editor/extensions/frontmatter/frontmatter-view'

/**
 * The note's YAML frontmatter, as a real node at the start of the document
 * rather than separate React state - see `extensions.ts`'s `doc` content
 * expression for how "at most one, always first" is enforced.
 *
 * `code: true` gives it the same text-with-embedded-newlines editing model
 * `codeBlock` already uses (marks disabled, Enter inserts `\n` instead of
 * splitting into a new node). `isolating` keeps it from merging with a
 * following paragraph on backspace/selection the way `codeBlock` doesn't need
 * to worry about, since frontmatter is always the document's very first node.
 *
 * markdown-it never sees a `---` character: parsing stays the regex-based
 * `splitFrontmatter` it always was, and this node is inserted programmatically
 * after `setContent` runs (see `use-frontmatter-document.ts`). `parse` is
 * therefore an empty stub, the same shape `table/extension.ts` uses for a node
 * whose parse side markdown-it already handles - except here nothing ever
 * reaches it at all.
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
				// The block's text already contains its `---` fences verbatim (see
				// `frontmatter-fence.ts`), so this only needs to write it back out.
				serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
					state.text(node.textContent, false)
					state.ensureNewLine()
					state.closeBlock(node)
				},
				parse: {},
			},
		}
	},
})
