import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { createUnlinkCommand } from '@/editor/extensions/link/unlink-command'

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

describe('createUnlinkCommand', () => {
	it('removes a text link, delimiters included', () => {
		const editor = makeEditor('Read [the notes](https://example.com) now')
		editor.commands.setTextSelection(10)

		createUnlinkCommand(editor.schema.marks.link)(
			editor.state,
			editor.view.dispatch
		)

		expect(editor.storage.markdown.getMarkdown()).toBe('Read the notes now')
	})

	it('removes the mark from an image with no text run to strip delimiters from', () => {
		const editor = makeEditor(
			'[![alt](/icon-editor-markdown-notes.png)](https://example.com)'
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
})
