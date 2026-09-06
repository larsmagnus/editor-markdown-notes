import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { createDeletionProbe } from '@/editor/extensions/syntax-repair/authored-deletion'

/** An editor holding `<p>hello world</p>`, whose text spans positions 1-12. */
function editorWithParagraph() {
	const editor = new Editor({ extensions: [StarterKit], content: '' })
	editor.commands.setContent('<p>hello world</p>')
	return editor
}

describe('createDeletionProbe', () => {
	it('reports a range the transaction deleted', () => {
		const editor = editorWithParagraph()
		const transaction = editor.state.tr.delete(1, 6)

		const probe = createDeletionProbe([transaction])

		expect(probe.deleted(1, 6)).toBe(true)
		editor.destroy()
	})

	it('reports a range only partially deleted', () => {
		const editor = editorWithParagraph()
		const transaction = editor.state.tr.delete(3, 6)

		const probe = createDeletionProbe([transaction])

		expect(probe.deleted(1, 6)).toBe(true)
		editor.destroy()
	})

	it('leaves a range the transaction did not touch', () => {
		const editor = editorWithParagraph()
		const transaction = editor.state.tr.delete(7, 12)

		const probe = createDeletionProbe([transaction])

		expect(probe.deleted(1, 6)).toBe(false)
		editor.destroy()
	})

	it('does not read an insertion as a deletion', () => {
		const editor = editorWithParagraph()
		const transaction = editor.state.tr.insertText('there ', 7)

		const probe = createDeletionProbe([transaction])

		expect(probe.deleted(1, 6)).toBe(false)
		expect(probe.deleted(6, 8)).toBe(false)
		editor.destroy()
	})

	it('sees a deletion split across the batch', () => {
		const editor = editorWithParagraph()
		const first = editor.state.tr.delete(4, 6)
		const second = editor.state.apply(first).tr.delete(1, 4)

		const probe = createDeletionProbe([first, second])

		expect(probe.deleted(1, 6)).toBe(true)
		editor.destroy()
	})

	it('maps a surviving position forward through the batch', () => {
		const editor = editorWithParagraph()
		const transaction = editor.state.tr.delete(1, 6)

		const probe = createDeletionProbe([transaction])

		expect(probe.forward(7)).toBe(2)
		editor.destroy()
	})

	it('reports nothing deleted for a batch that changed no text', () => {
		const editor = editorWithParagraph()

		const probe = createDeletionProbe([editor.state.tr])

		expect(probe.deleted(1, 6)).toBe(false)
		expect(probe.forward(7)).toBe(7)
		editor.destroy()
	})
})
