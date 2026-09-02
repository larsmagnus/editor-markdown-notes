import { mergeAttributes } from '@tiptap/core'
import CodeBlock from '@tiptap/extension-code-block'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import { CodeBlockView } from '@/editor/extensions/code-block/code-block-view'
import {
	fenceLanguage,
	insertLiteralFences,
} from '@/editor/extensions/code-block/code-fence'
import { createFenceInputRule } from '@/editor/extensions/code-block/fence-input-rule'
import { createToggleCodeBlockCommand } from '@/editor/extensions/code-block/toggle-code-block-command'
import type { MarkdownIt } from '@/editor/extensions/markdown/markdown-it-types'

/** Never reconfigured elsewhere in this project - see the stock extension's own default. */
const LANGUAGE_CLASS_PREFIX = 'language-'

/**
 * The name stays `codeBlock`, which keeps `tiptap-markdown`'s fenced block
 * serializer attached. The node view only changes how a block is drawn: a
 * `mermaid` one renders its diagram, everything else stays a `<pre>`.
 *
 * `language` is no longer a node attribute - the fence-open line is real,
 * editable text in the block's content, and an attribute kept in sync with it
 * would be a second source of truth. Parsing the text instead is what makes
 * retyping the language tag live-update highlighting, with nothing to resync.
 * The input rule and `block-marker/` keep every path that can create a block
 * honest about there being fence text at all - the fences are that mechanism's
 * leading and trailing markers, so deleting one unwraps the block exactly as
 * deleting a heading's `#` unwraps a heading.
 */
export const CodeBlockExtension = CodeBlock.extend({
	addAttributes() {
		return {}
	},

	renderHTML({ node, HTMLAttributes }) {
		const language = fenceLanguage(node.textContent)
		return [
			'pre',
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
			[
				'code',
				{
					class: language ? this.options.languageClassPrefix + language : null,
				},
				0,
			],
		]
	},

	addNodeView() {
		return ReactNodeViewRenderer(CodeBlockView)
	},

	addCommands() {
		const parent = this.parent?.()

		return {
			...parent,
			toggleCodeBlock: createToggleCodeBlockCommand(
				this.name,
				parent?.toggleCodeBlock
			),
		}
	},

	addInputRules() {
		return [createFenceInputRule(this.type)]
	},

	addStorage() {
		return {
			markdown: {
				// The text already contains its fences, so synthesizing them here -
				// the stock behavior - would double them up.
				serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
					state.text(node.textContent, false)
					state.ensureNewLine()
					state.closeBlock(node)
				},
				parse: {
					setup(markdownit: MarkdownIt) {
						markdownit.set({ langPrefix: LANGUAGE_CLASS_PREFIX })
					},
					// Accepted loss: markdown-it normalizes to a 3-backtick fence, so a
					// file's 4+ backtick fence cannot be recovered. Exact from then on.
					updateDOM(element: HTMLElement) {
						insertLiteralFences(element, LANGUAGE_CLASS_PREFIX)
					},
				},
			},
		}
	},
})
