import { describe, expect, it } from 'vitest'

import { createToggleHeadingCommand } from '@/editor/extensions/heading/toggle-heading-command'
import { createEditor } from '@/test-utils/editor'

describe('createToggleHeadingCommand', () => {
	// Regression: a list item's own content spec requires its first child to
	// be a paragraph, so applying setNodeMarkup(heading) there used to throw
	// instead of declining.
	it('declines rather than throwing when the caret is inside a list item', () => {
		const editor = createEditor('- one\n- two', { parseOnly: true })
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
		const editor = createEditor('Some notes', { parseOnly: true })

		createToggleHeadingCommand(
			editor.schema.nodes.heading,
			editor.schema.nodes.paragraph,
			1
		)(editor.state, editor.view.dispatch)

		expect(editor.storage.markdown.getMarkdown()).toBe('# Some notes')
	})
})
