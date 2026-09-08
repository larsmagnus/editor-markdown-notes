import { mergeAttributes } from '@tiptap/core'
import CodeBlock from '@tiptap/extension-code-block'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { unwrapConstructAtCaret } from '#src/editor/extensions/block-marker/unwrap-at-caret'
import { CodeBlockView } from '#src/editor/extensions/code-block/code-block-view'
import {
	fenceLanguage,
	insertLiteralFences,
} from '#src/editor/extensions/code-block/code-fence'
import { createFenceInputRule } from '#src/editor/extensions/code-block/fence-input-rule'
import { createToggleCodeBlockCommand } from '#src/editor/extensions/code-block/toggle-code-block-command'
import type { MarkdownIt } from '#src/editor/extensions/markdown/markdown-it-types'
import { serializeVerbatim } from '#src/editor/extensions/markdown/serialize-verbatim'

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

	/**
	 * Backspace at the very start of the fence line means "this is not a code
	 * block", and has to take the fences with it. The stock handler leaves them
	 * behind as literal paragraph text, which markdown-it reads straight back as
	 * a code block - so the unwrap undoes itself on the next load.
	 *
	 * Spread, not returned alone: `addKeyboardShortcuts` on an extended node
	 * replaces the stock map rather than adding to it, and the stock map is what
	 * carries `Mod-Alt-c` and triple-Enter-to-exit.
	 */
	addKeyboardShortcuts() {
		return {
			...this.parent?.(),
			Backspace: () =>
				this.editor.commands.command(({ state, dispatch }) => {
					const { $from, empty } = state.selection
					if (!empty || $from.parent.type !== this.type) return false
					if ($from.parentOffset !== 0) return false

					return unwrapConstructAtCaret(this.name)(state, dispatch)
				}),
		}
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
				serialize: serializeVerbatim,
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
