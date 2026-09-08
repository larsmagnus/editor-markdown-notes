import { describe, expect, it } from 'vitest'

import { createUnlinkCommand } from '#src/editor/extensions/link/unlink-command'
import { createEditor } from '#src/test-utils/editor'

describe('createUnlinkCommand', () => {
	it('removes a text link, delimiters included', () => {
		const editor = createEditor('Read [the notes](https://example.com) now', {
			parseOnly: true,
		})
		editor.commands.setTextSelection(10)

		createUnlinkCommand(editor.schema.marks.link)(
			editor.state,
			editor.view.dispatch
		)

		expect(editor.storage.markdown.getMarkdown()).toBe('Read the notes now')
	})

	it('removes the mark from an image with no text run to strip delimiters from', () => {
		const editor = createEditor(
			'[![alt](/icon-editor-markdown-notes.png)](https://example.com)',
			{ parseOnly: true }
		)
		editor.commands.setNodeSelection(0)

		createUnlinkCommand(editor.schema.marks.link)(
			editor.state,
			editor.view.dispatch
		)

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'![alt](/icon-editor-markdown-notes.png)'
		)
	})

	it('declines where there is no link, so the toolbar button can disable', () => {
		const editor = createEditor('Just some prose with no link in it', {
			parseOnly: true,
		})
		editor.commands.setTextSelection({ from: 1, to: 10 })

		const applied = createUnlinkCommand(editor.schema.marks.link)(
			editor.state,
			editor.view.dispatch
		)

		expect(applied).toBe(false)
	})
})
