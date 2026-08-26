import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { getDocumentText } from '@/lib/text-tools/document-text'
import { offsetToPosition } from '@/lib/text-tools/offset-to-position'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

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
		currentEditor = editor

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
		currentEditor = editor

		expect(getDocumentText(editor.state.doc).text).toBe(
			'Real prose here.\n\nMore prose.'
		)
	})

	it('stands a space in for an inline code span', () => {
		const editor = new Editor({
			extensions,
			content: 'Run `pnpm build`, then `pnpm test`.',
		})
		currentEditor = editor

		// A space rather than nothing, so the words on either side of a span with
		// no whitespace around it are not welded into one.
		expect(getDocumentText(editor.state.doc).text).toBe('Run  , then  .')
	})

	it('places text after an inline code span at its real position', () => {
		const editor = new Editor({
			extensions,
			content: 'Call the `useEffect` hook.',
		})
		currentEditor = editor

		const documentText = getDocumentText(editor.state.doc)
		const from = offsetToPosition(
			documentText,
			documentText.text.indexOf('hook')
		)

		// The span it stands in for is nine characters longer than the space that
		// replaced it, so the word after it only lands right if the slice table
		// carries the real document position rather than a running count.
		expect(from).not.toBeNull()
		expect(editor.state.doc.textBetween(from ?? 0, (from ?? 0) + 4)).toBe(
			'hook'
		)
	})

	it('reads each frontmatter line as its own block rather than one run-on line', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		editor.commands.setContent('Real prose here.')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [
				{ type: 'text', text: '---\ntitle: Roadmap\nstatus: draft\n---' },
			],
		})

		// Joined the same way separate blocks are elsewhere - retext has no
		// concept of YAML's line-based structure, so without this a whole
		// multi-line frontmatter block reads as one incoherent run-on sentence.
		// The keys are dropped: they are identifiers, and the speller would flag
		// most of them on every note in the workspace.
		expect(getDocumentText(editor.state.doc).text).toBe(
			'Roadmap\n\ndraft\n\nReal prose here.'
		)
	})

	// Regression: the `---` fence lines are real text in the node's own content
	// now, not markup added only at save time - fed to `getDocumentText`
	// unstripped, they used to reach retext as if they were YAML prose lines.
	it('excludes the --- fence lines from the analyzed text', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		editor.commands.setContent('Real prose here.')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: '---\ntitle: Roadmap\n---' }],
		})

		const { text } = getDocumentText(editor.state.doc)
		expect(text).not.toContain('-')
		expect(text).toBe('Roadmap\n\nReal prose here.')
	})

	it('drops a blank line inside frontmatter rather than emitting an empty block', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		editor.commands.setContent('Real prose here.')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [
				{ type: 'text', text: '---\ntitle: Roadmap\n\nstatus: draft\n---' },
			],
		})

		expect(getDocumentText(editor.state.doc).text).toBe(
			'Roadmap\n\ndraft\n\nReal prose here.'
		)
	})

	it('keeps a frontmatter line that is not a key/value pair whole', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		editor.commands.setContent('Real prose here.')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [
				{ type: 'text', text: '---\ntags:\n  - Some prose in a list\n---' },
			],
		})

		// A bare `tags:` has no value to keep, so it contributes nothing; the
		// list item below it has no key, so it survives whole.
		expect(getDocumentText(editor.state.doc).text).toBe(
			'- Some prose in a list\n\nReal prose here.'
		)
	})

	it('reads nothing out of an empty frontmatter block', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		editor.commands.setContent('Real prose here.')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: '---\n---' }],
		})

		expect(getDocumentText(editor.state.doc).text).toBe('Real prose here.')
	})

	it('joins the text nodes a mark splits a paragraph into', () => {
		const editor = new Editor({
			extensions,
			content: 'The **report** was written.',
		})
		currentEditor = editor

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
		currentEditor = editor

		expect(getDocumentText(editor.state.doc).text).toBe(
			'first line\nsecond line'
		)
	})

	it('keeps an inline image from joining the words around it', () => {
		const editor = new Editor({
			extensions,
			content: 'see![shot](/a.png)here',
		})
		currentEditor = editor

		expect(getDocumentText(editor.state.doc).text).toBe('see here')
	})

	// Regression: once a mark's delimiters are ensured into real document text
	// (`ensure-delimiters-plugin.ts`), a run built directly with that text -
	// the shape any already-open document actually has, since `new Editor({
	// content })` alone never runs that safety net - used to reach retext with
	// its `**`/`~~` intact, which can hide a phrase-level issue the delimiter
	// breaks apart.
	it('strips bold and strike delimiters but keeps the marked text as prose', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'This is ' },
						{ type: 'text', marks: [{ type: 'bold' }], text: '**truly**' },
						{ type: 'text', text: ' and ' },
						{ type: 'text', marks: [{ type: 'strike' }], text: '~~struck~~' },
						{ type: 'text', text: ' fine.' },
					],
				},
			],
		})

		const documentText = getDocumentText(editor.state.doc)
		expect(documentText.text).toBe('This is truly and struck fine.')

		const from = offsetToPosition(
			documentText,
			documentText.text.indexOf('fine')
		)
		expect(from).not.toBeNull()
		expect(editor.state.doc.textBetween(from ?? 0, (from ?? 0) + 4)).toBe(
			'fine'
		)
	})

	it('strips italic delimiters but keeps the marked text as prose', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'This is ' },
						{
							type: 'text',
							marks: [{ type: 'italic', attrs: { markup: '_' } }],
							text: '_truly_',
						},
						{ type: 'text', text: ' fine.' },
					],
				},
			],
		})

		expect(getDocumentText(editor.state.doc).text).toBe('This is truly fine.')
	})

	it('reads headings and list items as prose too', () => {
		const editor = new Editor({
			extensions,
			content: '# A heading\n\n- One item\n- Another',
		})
		currentEditor = editor

		expect(getDocumentText(editor.state.doc).text).toBe(
			'A heading\n\nOne item\n\nAnother'
		)
	})

	it('reads a blockquote as prose too, without its own leading "> "', () => {
		const editor = new Editor({
			extensions,
			content: '> A quoted sentence.',
		})
		currentEditor = editor

		expect(getDocumentText(editor.state.doc).text).toBe('A quoted sentence.')
	})
})
