import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

/**
 * `setContent` then an edit, so the link's `[`/`](href)` are real text by the
 * time each case starts - which is the only state in which they can be edited.
 */
function linkDocument(markdown: string): Editor {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)
	editor.commands.insertContentAt(1, 'x')
	editor.commands.deleteRange({ from: 1, to: 2 })
	return editor
}

/**
 * A link's closing delimiter passes through states that do not parse while it
 * is being typed - a URL with a space in it, or a `)` momentarily deleted.
 * Read as "absent" rather than "mid-edit", the repair pass appends a second
 * closing delimiter built from the stale attributes, and the result is
 * permanent: on the next pass the appended text parses and matches, so nothing
 * ever corrects it.
 */
describe('editing a link URL', () => {
	it('does not append a second delimiter when the closing paren is deleted', () => {
		const editor = linkDocument('Read [the guide](https://example.com) now.')
		const text = editor.state.doc.textContent
		const closingParen = text.lastIndexOf(')') + 1

		editor.commands.deleteRange({ from: closingParen, to: closingParen + 1 })

		expect(editor.state.doc.textContent).not.toContain(
			'](https://example.com]('
		)
	})

	it('does not append a second delimiter for a URL holding a space', () => {
		const editor = linkDocument('Read [the guide](./notes.md) now.')
		const text = editor.state.doc.textContent
		const slashIndex = text.indexOf('./notes.md') + '.'.length + 1

		editor.commands.insertContentAt(slashIndex, ' ')

		expect(editor.state.doc.textContent).not.toContain('](./notes.md](')
	})
})

/**
 * The delimiter is real text, so Backspace lands in it the way it lands in any
 * other text - and every character of it is one keystroke away from a state
 * that no longer parses as a link.
 */
describe('backspacing a link delimiter', () => {
	it('removes the whole link rather than duplicating its closing bracket', () => {
		const editor = linkDocument(
			'Read [the guide](https://example.com "Example Domain") now.'
		)
		// Just after the `(` that opens the URL - inside the closing delimiter.
		const caret = editor.state.doc.textContent.indexOf('](') + 3

		editor.commands.setTextSelection(caret)
		editor.commands.keyboardShortcut('Backspace')

		expect(editor.state.doc.textContent).toBe('Read the guide now.')
	})

	it('removes the whole link from inside its opening bracket', () => {
		const editor = linkDocument('Read [the guide](https://example.com) now.')
		const caret = editor.state.doc.textContent.indexOf('[') + 2

		editor.commands.setTextSelection(caret)
		editor.commands.keyboardShortcut('Backspace')

		expect(editor.state.doc.textContent).toBe('Read the guide now.')
	})
})
