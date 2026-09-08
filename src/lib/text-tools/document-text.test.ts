import { describe, expect, it } from 'vitest'

import { getDocumentText } from '#src/lib/text-tools/document-text'
import { offsetToPosition } from '#src/lib/text-tools/offset-to-position'
import { createEditor } from '#src/test-utils/editor'

/**
 * The flat text retext analyses, built from the same schema the editor runs on
 * so these assertions track the real document shape rather than a stand-in.
 */
describe('getDocumentText', () => {
	it('separates blocks so retext sees distinct sentences', () => {
		const editor = createEditor('First one\n\nSecond one', { parseOnly: true })

		expect(getDocumentText(editor.state.doc).text).toBe(
			'First one\n\nSecond one'
		)
	})

	it('leaves code blocks out entirely', () => {
		const editor = createEditor(
			'Real prose here.\n\n```js\nconst utilize = 1\n```\n\nMore prose.',
			{ parseOnly: true }
		)

		expect(getDocumentText(editor.state.doc).text).toBe(
			'Real prose here.\n\nMore prose.'
		)
	})

	it('stands a space in for an inline code span', () => {
		const editor = createEditor('Run `pnpm build`, then `pnpm test`.', {
			parseOnly: true,
		})

		// A space rather than nothing, so the words on either side of a span with
		// no whitespace around it are not welded into one.
		expect(getDocumentText(editor.state.doc).text).toBe('Run  , then  .')
	})

	it('places text after an inline code span at its real position', () => {
		const editor = createEditor('Call the `useEffect` hook.', {
			parseOnly: true,
		})

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
		const editor = createEditor('Real prose here.')
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
		const editor = createEditor('Real prose here.')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: '---\ntitle: Roadmap\n---' }],
		})

		const { text } = getDocumentText(editor.state.doc)
		expect(text).not.toContain('-')
		expect(text).toBe('Roadmap\n\nReal prose here.')
	})

	it('drops a blank line inside frontmatter rather than emitting an empty block', () => {
		const editor = createEditor('Real prose here.')
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
		const editor = createEditor('Real prose here.')
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
		const editor = createEditor('Real prose here.')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: '---\n---' }],
		})

		expect(getDocumentText(editor.state.doc).text).toBe('Real prose here.')
	})

	it('joins the text nodes a mark splits a paragraph into', () => {
		const editor = createEditor('The **report** was written.', {
			parseOnly: true,
		})

		expect(getDocumentText(editor.state.doc).text).toBe(
			'The report was written.'
		)
	})

	it('breaks a line rather than welding the words either side of a hard break', () => {
		// Two trailing spaces is markdown's hard break.
		const editor = createEditor('first line  \nsecond line', {
			parseOnly: true,
		})

		expect(getDocumentText(editor.state.doc).text).toBe(
			'first line\nsecond line'
		)
	})

	it('keeps an inline image from joining the words around it', () => {
		const editor = createEditor('see![shot](/a.png)here', { parseOnly: true })

		expect(getDocumentText(editor.state.doc).text).toBe('see here')
	})

	// Regression: once a mark's delimiters are ensured into real document text
	// (`ensure-delimiters-plugin.ts`), a run built directly with that text -
	// the shape any already-open document actually has, since `new Editor({
	// content })` alone never runs that safety net - used to reach retext with
	// its `**`/`~~` intact, which can hide a phrase-level issue the delimiter
	// breaks apart.
	it('strips bold and strike delimiters but keeps the marked text as prose', () => {
		const editor = createEditor({
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
		const editor = createEditor({
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
		const editor = createEditor('# A heading\n\n- One item\n- Another', {
			parseOnly: true,
		})

		expect(getDocumentText(editor.state.doc).text).toBe(
			'A heading\n\nOne item\n\nAnother'
		)
	})

	it('reads a blockquote as prose too, without its own leading "> "', () => {
		const editor = createEditor('> A quoted sentence.', { parseOnly: true })

		expect(getDocumentText(editor.state.doc).text).toBe('A quoted sentence.')
	})
})

/**
 * A mark's delimiters only become real text on the transaction after it is
 * parsed, so a freshly built document never shows this - which is exactly the
 * shape the parity harness compares against. These drive an edit through first,
 * putting the document in the state it actually holds while being typed in.
 */
describe('getDocumentText once delimiters are real text', () => {
	it('keeps a link out of the prose it hands retext', () => {
		const editor = createEditor(
			'Read [the guide](https://example.com/guide) first.',
			{ parseOnly: true }
		)
		editor.commands.insertContentAt(1, 'x')
		editor.commands.deleteRange({ from: 1, to: 2 })

		expect(editor.state.doc.textContent).toContain(
			'](https://example.com/guide)'
		)
		expect(getDocumentText(editor.state.doc).text).toBe('Read the guide first.')

		editor.destroy()
	})

	it('keeps bold delimiters out of it too', () => {
		const editor = createEditor('This is **truly** fine.', { parseOnly: true })
		editor.commands.insertContentAt(1, 'x')
		editor.commands.deleteRange({ from: 1, to: 2 })

		expect(editor.state.doc.textContent).toContain('**truly**')
		expect(getDocumentText(editor.state.doc).text).toBe('This is truly fine.')

		editor.destroy()
	})
})
