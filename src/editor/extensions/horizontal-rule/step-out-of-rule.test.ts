import { Schema } from '@tiptap/pm/model'
import { EditorState } from '@tiptap/pm/state'
import { describe, expect, it } from 'vitest'

import { stepOutOfRule } from '#src/editor/extensions/horizontal-rule/step-out-of-rule'
import { createEditor } from '#src/test-utils/editor'

describe('stepOutOfRule', () => {
	it('inserts a paragraph at the given position and moves the caret into it', () => {
		const editor = createEditor()
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'horizontalRule',
					content: [{ type: 'text', text: '---' }],
				},
			],
		})
		// One position inside the rule's own text, the way the caret sits right
		// after typing `---` - `$from.after()` is the position right past the
		// rule's own closing token, where the new paragraph belongs.
		const ruleEnd = editor.state.doc.resolve(2).after()
		const tr = editor.state.tr

		const handled = stepOutOfRule(tr, ruleEnd)
		editor.view.dispatch(tr)

		expect(handled).toBe(true)
		expect(editor.state.doc.nodeAt(ruleEnd)?.type.name).toBe('paragraph')
		expect(editor.state.selection.from).toBe(ruleEnd + 1)
	})

	it('reports false and leaves the transaction untouched without a paragraph node', () => {
		const schema = new Schema({
			nodes: {
				doc: { content: 'text*' },
				text: {},
			},
		})
		const state = EditorState.create({ schema })
		const tr = state.tr

		const handled = stepOutOfRule(tr, 0)

		expect(handled).toBe(false)
		expect(tr.docChanged).toBe(false)
	})
})
