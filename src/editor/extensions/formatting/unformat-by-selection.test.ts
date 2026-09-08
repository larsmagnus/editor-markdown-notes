import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { createEditor } from '#src/test-utils/editor'

/**
 * `setContent` then an edit, so every delimiter is real text by the time the
 * case starts - which is the only state in which one can be backspaced at.
 */
function documentFrom(markdown: string): Editor {
	const editor = createEditor(markdown)
	editor.commands.insertContentAt(1, 'x')
	editor.commands.deleteRange({ from: 1, to: 2 })
	return editor
}

/**
 * A selection dragged over a delimiter, a cut, or a replacement typed over it
 * all reach repair as a run whose delimiter is simply gone - the deletion
 * arriving as a transaction rather than a keystroke, which is what makes this
 * the half of the behaviour worth asserting here. The keystroke half is
 * `e2e/inline-marks-unformat-backspace.spec.ts`: single-character deletion is the
 * browser's own, and no keymap handler sees it.
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
