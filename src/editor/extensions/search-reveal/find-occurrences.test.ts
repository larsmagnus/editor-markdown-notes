import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { findOccurrences } from '@/editor/extensions/search-reveal/find-occurrences'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

/** The text each found range actually covers, which is what a highlight draws. */
function textAt(editor: Editor, needle: string): string[] {
	return findOccurrences(editor.state.doc, needle).map(({ from, to }) =>
		editor.state.doc.textBetween(from, to)
	)
}

/**
 * Built on the real editor schema, so these track the document the app actually
 * renders rather than a stand-in.
 */
describe('findOccurrences', () => {
	it('finds the searched-for text in prose', () => {
		const editor = new Editor({
			extensions,
			content: 'The email field is required.\n\nAnother email here.',
		})
		currentEditor = editor

		expect(textAt(editor, 'email')).toEqual(['email', 'email'])
	})

	/**
	 * The reported bug sits inside a fenced HTML block, which `getDocumentText`
	 * skips because code is not prose. Search does not skip it, so neither can
	 * this.
	 */
	it('finds text inside a code block', () => {
		const editor = new Editor({
			extensions,
			content:
				'Prose first.\n\n```html\n<input id="email" required />\n```\n\nProse after.',
		})
		currentEditor = editor

		expect(textAt(editor, '<input')).toEqual(['<input'])
	})

	it('ignores case, so a case-insensitive search still lands', () => {
		const editor = new Editor({
			extensions,
			content: 'Email addresses, and the email field.',
		})
		currentEditor = editor

		expect(textAt(editor, 'email')).toEqual(['Email', 'email'])
	})

	it('finds several matches on one line separately', () => {
		const editor = new Editor({
			extensions,
			content: '```html\n<input id="first" /><input id="second" />\n```',
		})
		currentEditor = editor

		expect(textAt(editor, '<input')).toEqual(['<input', '<input'])
	})

	/**
	 * The match ran past what the query could pin down (`deriveQueryLength`
	 * returns a bound, not a measurement), so the text it carries is not in the
	 * document. Finding nothing is the right answer - the alternative is
	 * highlighting a place the user did not search for.
	 */
	it('finds nothing when the text is not in the document', () => {
		const editor = new Editor({
			extensions,
			content: 'The email field is required.',
		})
		currentEditor = editor

		expect(findOccurrences(editor.state.doc, 'email field is req**')).toEqual(
			[]
		)
	})

	it('finds nothing for empty text', () => {
		const editor = new Editor({ extensions, content: 'Anything at all.' })
		currentEditor = editor

		expect(findOccurrences(editor.state.doc, '')).toEqual([])
	})

	/**
	 * The source read `**bold** text`, so search matched across the markers. The
	 * rendered document splits that into two text nodes with no `**` between
	 * them, and there is no single honest range to highlight.
	 */
	it('declines a match split across a mark boundary', () => {
		const editor = new Editor({
			extensions,
			content: '**bold** text follows',
		})
		currentEditor = editor

		expect(findOccurrences(editor.state.doc, 'bold text')).toEqual([])
		expect(textAt(editor, 'bold')).toEqual(['bold'])
	})
})
