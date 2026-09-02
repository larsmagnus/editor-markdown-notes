import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

/**
 * `setContent` then an edit, so every delimiter is real text by the time the
 * case starts - which is the only state in which one can be backspaced at.
 */
function documentFrom(markdown: string): Editor {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)
	editor.commands.insertContentAt(1, 'x')
	editor.commands.deleteRange({ from: 1, to: 2 })
	return editor
}

/**
 * Backspacing at a delimiter is how a writer unformats text without reaching
 * for the toolbar. It has to remove the whole construct: deleting the one
 * character the key asked for leaves a delimiter that no longer parses, which
 * repair reads as syntax to reinstate - so the style comes straight back and
 * the text cannot be unformatted by editing at all.
 */
describe('backspacing a closing delimiter', () => {
	it('unformats bold text', () => {
		const editor = documentFrom('Ship **the notes** today')
		editor.commands.setTextSelection(
			editor.state.doc.textContent.lastIndexOf('**') + 3
		)

		editor.commands.keyboardShortcut('Backspace')

		expect(editor.state.doc.textContent).toBe('Ship the notes today')
	})

	it('unformats italic text', () => {
		const editor = documentFrom('Ship *the notes* today')
		editor.commands.setTextSelection(
			editor.state.doc.textContent.lastIndexOf('*') + 2
		)

		editor.commands.keyboardShortcut('Backspace')

		expect(editor.state.doc.textContent).toBe('Ship the notes today')
	})

	it('unformats struck-through text', () => {
		const editor = documentFrom('Ship ~~the notes~~ today')
		editor.commands.setTextSelection(
			editor.state.doc.textContent.lastIndexOf('~~') + 3
		)

		editor.commands.keyboardShortcut('Backspace')

		expect(editor.state.doc.textContent).toBe('Ship the notes today')
	})

	it('unformats inline code', () => {
		const editor = documentFrom('Ship `the notes` today')
		editor.commands.setTextSelection(
			editor.state.doc.textContent.lastIndexOf('`') + 2
		)

		editor.commands.keyboardShortcut('Backspace')

		expect(editor.state.doc.textContent).toBe('Ship the notes today')
	})

	// The reported wrinkle: with nothing after the closing delimiter the caret
	// sits at the very end of the block, which is a different position to map
	// and a different run boundary to test against.
	it('unformats text with nothing following the delimiter', () => {
		const editor = documentFrom('Ship **the notes**')
		editor.commands.setTextSelection(
			editor.state.doc.textContent.lastIndexOf('**') + 3
		)

		editor.commands.keyboardShortcut('Backspace')

		expect(editor.state.doc.textContent).toBe('Ship the notes')
	})
})

/**
 * Not every deletion arrives as a keystroke at a delimiter. A selection
 * dragged over one, a cut, or a replacement typed over it all reach repair as
 * a run whose delimiter is simply gone.
 */
describe('deleting a delimiter by selection', () => {
	it('unformats rather than reinstating the delimiter', () => {
		const editor = documentFrom('Ship **the notes** today')
		const closing = editor.state.doc.textContent.lastIndexOf('**') + 1

		editor.commands.deleteRange({ from: closing, to: closing + 2 })

		expect(editor.state.doc.textContent).toBe('Ship the notes today')
	})

	it('unformats when the selection spans the delimiter and its text', () => {
		const editor = documentFrom('Ship **the notes** today')
		const opening = editor.state.doc.textContent.indexOf('**') + 1

		editor.commands.deleteRange({ from: opening, to: opening + 6 })

		expect(editor.state.doc.textContent).toBe('Ship notes today')
	})
})
