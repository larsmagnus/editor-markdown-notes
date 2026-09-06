import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { createToggleHeadingCommand } from '@/editor/extensions/heading/toggle-heading-command'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

function makeEditor(content: string): Editor {
	const editor = new Editor({ extensions, content })
	editors.push(editor)
	return editor
}

describe('createToggleHeadingCommand', () => {
	// Regression: a list item's own content spec requires its first child to
	// be a paragraph, so applying setNodeMarkup(heading) there used to throw
	// instead of declining.
	it('declines rather than throwing when the caret is inside a list item', () => {
		const editor = makeEditor('- one\n- two')
		editor.commands.setTextSelection(3)

		expect(() =>
			createToggleHeadingCommand(
				editor.schema.nodes.heading,
				editor.schema.nodes.paragraph,
				1
			)(editor.state, editor.view.dispatch)
		).not.toThrow()

		expect(editor.storage.markdown.getMarkdown()).toBe('- one\n- two')
	})

	it('still toggles a plain paragraph into a heading', () => {
		const editor = makeEditor('Some notes')

		createToggleHeadingCommand(
			editor.schema.nodes.heading,
			editor.schema.nodes.paragraph,
			1
		)(editor.state, editor.view.dispatch)

		expect(editor.storage.markdown.getMarkdown()).toBe('# Some notes')
	})
})
