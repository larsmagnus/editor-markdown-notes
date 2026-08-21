import { mergeAttributes, Node } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import { detectFrontmatter } from '@/editor/extensions/frontmatter/detect'
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

	// Frontmatter is always the document's first node, so there is nowhere for
	// Up/Left to go once the caret reaches its start - left to the default
	// keymap, ProseMirror's gap cursor still tries, landing a cursor above the
	// block with nothing rendered there to show for it. `endOfTextblock` (not a
	// plain position check) is what makes this correct for wrapped lines: it
	// asks the view whether the caret is on the first *visual* line, not just
	// at text offset 0.
	addKeyboardShortcuts() {
		const isAtFrontmatterEdge = (dir: 'up' | 'left') => {
			const { selection } = this.editor.state
			if (!selection.empty) return false
			if (selection.$from.parent.type.name !== 'frontmatter') return false
			return this.editor.view.endOfTextblock(dir)
		}

		return {
			ArrowUp: () => isAtFrontmatterEdge('up'),
			ArrowLeft: () => isAtFrontmatterEdge('left'),
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
				serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
					state.write('---\n')
					if (node.textContent) {
						state.text(node.textContent, false)
						state.write('\n')
					}
					state.write('---')
					state.closeBlock(node)
				},
				parse: {},
			},
		}
	},
})
