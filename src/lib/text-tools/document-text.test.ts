import { Editor } from '@tiptap/core'
import { describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
import {
	getDocumentText,
	offsetToPosition,
} from '@/lib/text-tools/document-text'

/**
 * Built from the same schema the editor runs on, so these assertions track the
 * real document shape rather than a hand-rolled stand-in.
 */
function documentFrom(markdown: string) {
	const editor = new Editor({ extensions, content: markdown })
	const documentText = getDocumentText(editor.state.doc)
	return { editor, documentText }
}

/** What the decoration would end up covering for a given text offset range. */
function textAt(
	editor: Editor,
	documentText: ReturnType<typeof getDocumentText>,
	start: number,
	end: number
) {
	const from = offsetToPosition(documentText, start)
	const to = offsetToPosition(documentText, end)
	if (from === null || to === null) return null

	return editor.state.doc.textBetween(from, to)
}

describe('getDocumentText', () => {
	it('separates blocks so retext sees distinct sentences', () => {
		const { documentText } = documentFrom('First one\n\nSecond one')

		expect(documentText.text).toBe('First one\n\nSecond one')
	})

	it('leaves code blocks out entirely', () => {
		const { documentText } = documentFrom(
			'Real prose here.\n\n```js\nconst utilize = 1\n```\n\nMore prose.'
		)

		expect(documentText.text).toBe('Real prose here.\n\nMore prose.')
	})

	it('joins the text nodes a mark splits a paragraph into', () => {
		const { documentText } = documentFrom('The **report** was written.')

		expect(documentText.text).toBe('The report was written.')
	})

	it('breaks a line rather than welding the words either side of a hard break', () => {
		// Two trailing spaces is markdown's hard break.
		const { documentText } = documentFrom('first line  \nsecond line')

		expect(documentText.text).toBe('first line\nsecond line')
	})

	it('keeps an inline image from joining the words around it', () => {
		const { documentText } = documentFrom('see![shot](/a.png)here')

		expect(documentText.text).toBe('see here')
	})

	it('reads headings and list items as prose too', () => {
		const { documentText } = documentFrom(
			'# A heading\n\n- One item\n- Another'
		)

		expect(documentText.text).toBe('A heading\n\nOne item\n\nAnother')
	})
})

describe('offsetToPosition', () => {
	it('maps an offset back to the text it came from', () => {
		const { editor, documentText } = documentFrom('The report was written.')
		const start = documentText.text.indexOf('written')

		expect(textAt(editor, documentText, start, start + 'written'.length)).toBe(
			'written'
		)
	})

	it('stays correct in the block after a separator', () => {
		const { editor, documentText } = documentFrom('First one\n\nSecond one')
		const start = documentText.text.indexOf('Second')

		expect(textAt(editor, documentText, start, start + 'Second'.length)).toBe(
			'Second'
		)
	})

	it('stays correct across a mark boundary', () => {
		const { editor, documentText } = documentFrom('The **report** was written.')
		const start = documentText.text.indexOf('report was')

		expect(
			textAt(editor, documentText, start, start + 'report was'.length)
		).toBe('report was')
	})

	it('skips over a code block when mapping the prose after it', () => {
		const { editor, documentText } = documentFrom(
			'Before.\n\n```js\nconst x = 1\n```\n\nAfter the code.'
		)
		const start = documentText.text.indexOf('After')

		expect(textAt(editor, documentText, start, start + 'After'.length)).toBe(
			'After'
		)
	})

	it('has nothing to map in an empty document', () => {
		const { documentText } = documentFrom('')

		expect(offsetToPosition(documentText, 0)).toBeNull()
	})
})
