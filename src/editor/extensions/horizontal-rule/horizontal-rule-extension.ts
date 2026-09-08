import { mergeAttributes, Node } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import { createHorizontalRuleInputRule } from '#src/editor/extensions/horizontal-rule/horizontal-rule-input-rule'
import {
	HORIZONTAL_RULE_TEXT,
	insertLiteralRules,
} from '#src/editor/extensions/horizontal-rule/horizontal-rule-marker'
import { serializeVerbatim } from '#src/editor/extensions/markdown/serialize-verbatim'

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
	 * so there was nothing to step out of. Moving the caret into the new
	 * paragraph is the whole point: left behind, the next thing typed lands in
	 * the rule and stops it being one.
	 */
	addKeyboardShortcuts() {
		return {
			// Written onto the command's own transaction rather than dispatched
			// separately: a shortcut invoked through `commands.keyboardShortcut`
			// runs inside a chain, whose transaction is built from the state
			// before this ran and would put the selection back.
			Enter: () =>
				this.editor.commands.command(({ tr, state, dispatch }) => {
					const { $from } = state.selection
					if ($from.parent.type.name !== this.name) return false

					const paragraph = state.schema.nodes.paragraph
					if (!paragraph) return false
					if (!dispatch) return true

					const after = $from.after()
					tr.insert(after, paragraph.create())
					tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1)))
					tr.scrollIntoView()
					return true
				}),
		}
	},

	addInputRules() {
		return [createHorizontalRuleInputRule(this.type)]
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
