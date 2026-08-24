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
import { unwrapCodeBlockAtFenceStart } from '@/editor/extensions/code-block/unwrap-code-block'
import type { MarkdownIt } from '@/editor/extensions/markdown/markdown-it-types'

/** Never reconfigured elsewhere in this project - see the stock extension's own default. */
const LANGUAGE_CLASS_PREFIX = 'language-'

/**
 * The name stays `codeBlock`, which is what keeps `tiptap-markdown`'s fenced
 * block serializer attached (replaced below with one that no longer needs to
 * synthesize fences, since they're now live text the block's own content
 * carries). The node view only changes how a block is drawn: a `mermaid` one
 * renders its diagram, everything else stays a `<pre>`.
 *
 * `language` is no longer a node attribute - the fence-open line is real,
 * editable text inside the block's own content (see `code-fence.ts`), so an
 * attribute kept in sync with it would be a second source of truth for the
 * same fact. Every reader of "what language is this block" parses the text
 * instead (`fenceLanguage`), which is also what makes editing the fence
 * line's language tag live-update highlighting: there's nothing else to
 * resync.
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

	// Backspacing at the very start of the fence line - `parentOffset === 0`,
	// since the fence text is now the first thing in the block's content -
	// unwraps the block into a plain paragraph holding its code.
	addKeyboardShortcuts() {
		return {
			Backspace: () =>
				unwrapCodeBlockAtFenceStart(this.name)(
					this.editor.state,
					this.editor.view.dispatch
				),
		}
	},

	addStorage() {
		return {
			markdown: {
				// The block's text already contains its fences verbatim, so this
				// only needs to write it back out - synthesizing them here (the
				// stock behavior) would double them up on top of what's now real
				// content.
				serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
					state.text(node.textContent, false)
					state.ensureNewLine()
					state.closeBlock(node)
				},
				parse: {
					setup(markdownit: MarkdownIt) {
						markdownit.set({ langPrefix: LANGUAGE_CLASS_PREFIX })
					},
					// Known, accepted loss: markdown-it always normalizes to a
					// 3-backtick fence in its rendered HTML, so a file's non-default
					// fence length (4+ backticks) can't be recovered here -
					// serialization stays exact afterwards, since the content is
					// real text from then on.
					updateDOM(element: HTMLElement) {
						insertLiteralFences(element, LANGUAGE_CLASS_PREFIX)
					},
				},
			},
		}
	},
})
