import { Editor } from '@tiptap/core'
import { describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
import { getDocumentText } from '@/lib/text-tools/document-text'

/**
 * The flat text retext analyses, built from the same schema the editor runs on
 * so these assertions track the real document shape rather than a stand-in.
 */
describe('getDocumentText', () => {
	it('separates blocks so retext sees distinct sentences', () => {
		const editor = new Editor({
			extensions,
			content: 'First one\n\nSecond one',
		})

		expect(getDocumentText(editor.state.doc).text).toBe(
			'First one\n\nSecond one'
		)
	})

	it('leaves code blocks out entirely', () => {
		const editor = new Editor({
			extensions,
			content:
				'Real prose here.\n\n```js\nconst utilize = 1\n```\n\nMore prose.',
		})

		expect(getDocumentText(editor.state.doc).text).toBe(
			'Real prose here.\n\nMore prose.'
		)
	})

	it('reads each frontmatter line as its own block rather than one run-on line', () => {
		const editor = new Editor({ extensions, content: '' })
		editor.commands.setContent('Real prose here.')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: 'title: Roadmap\nstatus: draft' }],
		})

		// Joined the same way separate blocks are elsewhere - retext has no
		// concept of YAML's line-based structure, so without this a whole
		// multi-line frontmatter block reads as one incoherent run-on sentence.
		expect(getDocumentText(editor.state.doc).text).toBe(
			'title: Roadmap\n\nstatus: draft\n\nReal prose here.'
		)
	})

	it('drops a blank line inside frontmatter rather than emitting an empty block', () => {
		const editor = new Editor({ extensions, content: '' })
		editor.commands.setContent('Real prose here.')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: 'title: Roadmap\n\nstatus: draft' }],
		})

		expect(getDocumentText(editor.state.doc).text).toBe(
			'title: Roadmap\n\nstatus: draft\n\nReal prose here.'
		)
	})

	it('reads nothing out of an empty frontmatter block', () => {
		const editor = new Editor({ extensions, content: '' })
		editor.commands.setContent('Real prose here.')
		editor.commands.insertContentAt(0, { type: 'frontmatter' })

		expect(getDocumentText(editor.state.doc).text).toBe('Real prose here.')
	})

	it('joins the text nodes a mark splits a paragraph into', () => {
		const editor = new Editor({
			extensions,
			content: 'The **report** was written.',
		})

		expect(getDocumentText(editor.state.doc).text).toBe(
			'The report was written.'
		)
	})

	it('breaks a line rather than welding the words either side of a hard break', () => {
		// Two trailing spaces is markdown's hard break.
		const editor = new Editor({
			extensions,
			content: 'first line  \nsecond line',
		})

		expect(getDocumentText(editor.state.doc).text).toBe(
			'first line\nsecond line'
		)
	})

	it('keeps an inline image from joining the words around it', () => {
		const editor = new Editor({
			extensions,
			content: 'see![shot](/a.png)here',
		})

		expect(getDocumentText(editor.state.doc).text).toBe('see here')
	})

	it('reads headings and list items as prose too', () => {
		const editor = new Editor({
			extensions,
			content: '# A heading\n\n- One item\n- Another',
		})

		expect(getDocumentText(editor.state.doc).text).toBe(
			'A heading\n\nOne item\n\nAnother'
		)
	})
})
