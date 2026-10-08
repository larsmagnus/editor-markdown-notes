import { describe, expect, it } from 'vitest'

import { createEditor } from '#src/test-utils/editor'

/** The note after the author types `text` at the end of its first paragraph. */
function afterTyping(note: string, text: string): string {
	const editor = createEditor(note)
	editor.commands.setTextSelection(editor.state.doc.child(0).nodeSize - 1)
	editor.view.dispatch(editor.state.tr.insertText(text))
	return editor.storage.markdown.getMarkdown()
}

describe('saving an edited block', () => {
	it('writes a rule-shaped run typed into prose as typed', () => {
		expect(afterTyping('Score', ' ***')).toBe('Score ***')
	})

	it('writes an underscore and a tilde typed into prose as typed', () => {
		expect(afterTyping('Rename', ' snake_case ~44kB')).toBe(
			'Rename snake_case ~44kB'
		)
	})

	it('still escapes asterisks that would read back as emphasis', () => {
		expect(afterTyping('Maths', ' 2*3*4')).toBe('Maths 2\\*3\\*4')
	})

	it('still escapes a line that would read back as a list item', () => {
		const editor = createEditor('Intro')
		editor.view.dispatch(editor.state.tr.insertText('- not a list', 1, 6))

		expect(editor.storage.markdown.getMarkdown()).toBe('\\- not a list')
	})
})

describe('saving an edited block in a note with link references', () => {
	it('keeps brackets escaped where the note defines a matching reference', () => {
		const editor = createEditor('Intro\n\n[docs]: https://example.com')
		editor.commands.setTextSelection(editor.state.doc.child(0).nodeSize - 1)
		editor.view.dispatch(editor.state.tr.insertText(' see [docs]'))

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'Intro see \\[docs\\]\n\n[docs]: https://example.com'
		)
	})
})
