import { mergeAttributes, Node, textblockTypeInputRule } from '@tiptap/core'

import {
	HORIZONTAL_RULE_TEXT,
	insertLiteralRules,
} from '@/editor/extensions/horizontal-rule/horizontal-rule-marker'
import { serializeVerbatim } from '@/editor/extensions/markdown/serialize-verbatim'

/**
 * A horizontal rule holding its own `---` as real text, so the caret can reach
 * it, the reveal can show it, and editing it away leaves a paragraph - the
 * same bargain every other construct here makes. As TipTap's stock leaf atom
 * it had no text at all: nothing to put a caret in, nothing to reveal, and no
 * way to remove one except by selecting the node.
 *
 * `code: true` gives it the same text-with-no-marks editing model as
 * `codeBlock` and `frontmatter`. `defining` keeps a paste next to it from
 * being absorbed into it.
 */
export const HorizontalRuleExtension = Node.create({
	name: 'horizontalRule',
	group: 'block',
	content: 'text*',
	marks: '',
	code: true,
	defining: true,

	parseHTML() {
		return [{ tag: 'div[data-type="horizontalRule"]' }, { tag: 'hr' }]
	},

	// A `div`, not an `hr`: the text has to live somewhere, and `hr` is void.
	renderHTML({ HTMLAttributes }) {
		return [
			'div',
			mergeAttributes(HTMLAttributes, { 'data-type': 'horizontalRule' }),
			0,
		]
	},

	addCommands() {
		return {
			setHorizontalRule:
				() =>
				({ commands }) =>
					commands.insertContent({
						type: this.name,
						content: [{ type: 'text', text: HORIZONTAL_RULE_TEXT }],
					}),
		}
	},

	/**
	 * Enter leaves the rule rather than splitting it or, `code` being set,
	 * adding a newline inside it. A rule is one line by definition, and having
	 * just typed `---` the caret is still in it - as a leaf atom it never was,
	 * so there was nothing to step out of.
	 */
	addKeyboardShortcuts() {
		return {
			Enter: () => {
				if (!this.editor.isActive(this.name)) return false

				const after = this.editor.state.selection.$from.after()
				return this.editor
					.chain()
					.insertContentAt(after, { type: 'paragraph' })
					.setTextSelection(after + 1)
					.run()
			},
		}
	},

	// Typed rather than matched on completion: the marker is the node's whole
	// content, so the rule keeps the text it consumed instead of dropping it.
	addInputRules() {
		return [
			textblockTypeInputRule({
				find: /^(?:---|\*\*\*|___)$/,
				type: this.type,
			}),
		]
	},

	addStorage() {
		return {
			markdown: {
				serialize: serializeVerbatim,
				parse: {
					updateDOM: insertLiteralRules,
				},
			},
		}
	},
})
