import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { serializeVerbatim } from '#src/editor/extensions/markdown/serialize-verbatim'
import { MdxBlockView } from '#src/editor/extensions/mdx-block/mdx-block-view'

/**
 * An opaque, editable region for MDX syntax markdown-it has no grammar for -
 * JSX elements, `import`/`export` statements, `{expression}` blocks. Never
 * reached through markdown-it's own parse: like `frontmatter`, this node is
 * only ever produced by `restoreMdxBlocksInTransaction` after `setContent`
 * runs, from spans `detectMdxSpans` already found and verified.
 *
 * `code: true` gives it the same text-with-embedded-newlines editing model as
 * `codeBlock`/`frontmatter`: marks disabled, Enter inserts `\n` rather than
 * splitting the node. Deliberately has no Backspace-unwrap affordance -
 * unlike a code block's fences, dissolving this node into live prose would
 * immediately misparse its content, so it behaves as an ordinary text block
 * with no special exit-via-deletion path.
 */
export const MdxBlockExtension = Node.create({
	name: 'mdxBlock',
	group: 'block',
	content: 'text*',
	marks: '',
	code: true,
	defining: true,
	isolating: true,

	parseHTML() {
		return [{ tag: 'pre[data-type="mdx-block"]' }]
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'pre',
			mergeAttributes(HTMLAttributes, { 'data-type': 'mdx-block' }),
			['code', 0],
		]
	},

	addNodeView() {
		return ReactNodeViewRenderer(MdxBlockView)
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
