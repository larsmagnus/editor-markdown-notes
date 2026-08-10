import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'

const editors: Editor[] = []

function editorWithCode() {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(['```ts', 'const total = 1', '```'].join('\n'))
	return editor
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('SyntaxHighlight', () => {
	it('colors the range it is given', () => {
		const editor = editorWithCode()

		editor.commands.setSyntaxHighlightRanges([
			{ from: 1, to: 6, color: '#ff7b72' },
		])

		expect(editor.view.dom.innerHTML).toContain('color: #ff7b72')
	})

	it('renders each font style bit the token carries', () => {
		const editor = editorWithCode()

		editor.commands.setSyntaxHighlightRanges([
			{ from: 1, to: 6, color: '#ff7b72', fontStyle: 1 | 2 },
		])

		expect(editor.view.dom.innerHTML).toContain('font-style: italic')
		expect(editor.view.dom.innerHTML).toContain('font-weight: bold')
	})

	/**
	 * Shiki's `FontStyle.NotSet` is `-1`, which has every style bit set. Masking
	 * it would render one unstyled token as italic, bold, underlined and struck
	 * through at once.
	 */
	it('applies no font style for the NotSet sentinel', () => {
		const editor = editorWithCode()

		editor.commands.setSyntaxHighlightRanges([
			{ from: 1, to: 6, color: '#ff7b72', fontStyle: -1 },
		])

		expect(editor.view.dom.innerHTML).not.toContain('font-style')
		expect(editor.view.dom.innerHTML).not.toContain('text-decoration')
	})

	/**
	 * Tokenizing is async, so a pass can finish against a document that has
	 * since shrunk. A range past its end must be dropped rather than thrown on,
	 * which would take the whole editor down.
	 */
	it('drops a range that runs past the end of the document', () => {
		const editor = editorWithCode()

		expect(() =>
			editor.commands.setSyntaxHighlightRanges([
				{ from: 1, to: 9999, color: '#ff7b72' },
			])
		).not.toThrow()
	})

	it('drops an empty or inverted range', () => {
		const editor = editorWithCode()

		expect(() =>
			editor.commands.setSyntaxHighlightRanges([
				{ from: 5, to: 5, color: '#ff7b72' },
				{ from: 7, to: 2, color: '#ff7b72' },
			])
		).not.toThrow()
	})

	it('clears every color when handed no tokens', () => {
		const editor = editorWithCode()
		editor.commands.setSyntaxHighlightRanges([
			{ from: 1, to: 6, color: '#ff7b72' },
		])

		editor.commands.setSyntaxHighlightRanges([])

		expect(editor.view.dom.innerHTML).not.toContain('color: #ff7b72')
	})

	/** A decoration-only transaction must not look like an edit, or every
	 *  re-highlight would queue an auto-save of unchanged content. */
	it('does not change the document', () => {
		const editor = editorWithCode()
		const before = String(editor.storage.markdown.getMarkdown())

		editor.commands.setSyntaxHighlightRanges([
			{ from: 1, to: 6, color: '#ff7b72' },
		])

		expect(String(editor.storage.markdown.getMarkdown())).toBe(before)
	})
})
