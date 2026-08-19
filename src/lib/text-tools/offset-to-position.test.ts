import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
import { getDocumentText } from '@/lib/text-tools/document-text'
import { offsetToPosition } from '@/lib/text-tools/offset-to-position'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

/**
 * Mapping a retext offset back to a ProseMirror position. Each case asserts on
 * the text the resulting range covers, which is what the decoration will
 * underline.
 */
describe('offsetToPosition', () => {
	it('maps an offset back to the text it came from', () => {
		const editor = new Editor({
			extensions,
			content: 'The report was written.',
		})
		currentEditor = editor
		const documentText = getDocumentText(editor.state.doc)
		const start = documentText.text.indexOf('written')

		const from = offsetToPosition(documentText, start)
		const to = offsetToPosition(documentText, start + 'written'.length)

		expect(editor.state.doc.textBetween(from!, to!)).toBe('written')
	})

	it('stays correct in the block after a separator', () => {
		const editor = new Editor({
			extensions,
			content: 'First one\n\nSecond one',
		})
		currentEditor = editor
		const documentText = getDocumentText(editor.state.doc)
		const start = documentText.text.indexOf('Second')

		const from = offsetToPosition(documentText, start)
		const to = offsetToPosition(documentText, start + 'Second'.length)

		expect(editor.state.doc.textBetween(from!, to!)).toBe('Second')
	})

	it('stays correct across a mark boundary', () => {
		const editor = new Editor({
			extensions,
			content: 'The **report** was written.',
		})
		currentEditor = editor
		const documentText = getDocumentText(editor.state.doc)
		const start = documentText.text.indexOf('report was')

		const from = offsetToPosition(documentText, start)
		const to = offsetToPosition(documentText, start + 'report was'.length)

		expect(editor.state.doc.textBetween(from!, to!)).toBe('report was')
	})

	it('skips over a code block when mapping the prose after it', () => {
		const editor = new Editor({
			extensions,
			content: 'Before.\n\n```js\nconst x = 1\n```\n\nAfter the code.',
		})
		currentEditor = editor
		const documentText = getDocumentText(editor.state.doc)
		const start = documentText.text.indexOf('After')

		const from = offsetToPosition(documentText, start)
		const to = offsetToPosition(documentText, start + 'After'.length)

		expect(editor.state.doc.textBetween(from!, to!)).toBe('After')
	})

	it('has nothing to map in an empty document', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor

		expect(offsetToPosition(getDocumentText(editor.state.doc), 0)).toBeNull()
	})
})
