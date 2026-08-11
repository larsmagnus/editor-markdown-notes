import { CellSelection, TableMap } from '@tiptap/pm/tables'
import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'

const TABLE = [
	'| Quarter | Revenue | Growth |',
	'| --- | --- | --- |',
	'| Q1 2025 | 1.2M | 8% |',
	'| Q2 2025 | 1.4M | 17% |',
].join('\n')

const editors: Editor[] = []

/** A live editor on the app's own extensions, loaded the way a note is. */
function editorWith(markdown: string): Editor {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)

	return editor
}

/**
 * Selects the rectangle between two cells of the note's only table, numbered in
 * reading order - 0 is the first header cell, 3 the first body cell.
 */
function selectCells(editor: Editor, anchor: number, head: number): void {
	const { doc, tr } = editor.state
	const map = TableMap.get(doc.firstChild!)
	const cell = (index: number) => doc.resolve(1 + map.map[index])

	editor.view.dispatch(
		tr.setSelection(new CellSelection(cell(anchor), cell(head)))
	)
}

/**
 * Pastes `text` as the clipboard's text flavour, the way another application's
 * content arrives.
 *
 * Not `view.pasteText`, which hardcodes ProseMirror's `preferPlain` - the flag
 * a real Shift-paste sets - so it can never reach `clipboardTextParser`.
 */
function pasteText(editor: Editor, text: string): void {
	const event = new Event('paste', { bubbles: true, cancelable: true })
	Object.defineProperty(event, 'clipboardData', {
		value: { getData: (type: string) => (type === 'text/plain' ? text : '') },
	})

	editor.view.dom.dispatchEvent(event)
}

/** What the note would be saved as right now. */
function saved(editor: Editor): string {
	return String(editor.storage.markdown.getMarkdown()).trimEnd()
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('pasting a table', () => {
	it('turns markdown pasted from another application into a real table', () => {
		const editor = editorWith('')
		pasteText(editor, TABLE)

		expect(saved(editor)).toBe(TABLE)
	})

	it('keeps a copied cell range pasted outside the table it came from', () => {
		const editor = editorWith(TABLE)
		selectCells(editor, 3, 7)
		const { dom } = editor.view.serializeForClipboard(
			editor.state.selection.content()
		)

		editor.commands.setContent('')
		editor.view.pasteHTML(dom.innerHTML)

		expect(saved(editor)).toContain('| Q1 2025 | 1.2M |')
		expect(saved(editor)).toContain('| Q2 2025 | 1.4M |')
	})

	it('merges a copied cell range back into the cells it is pasted onto', () => {
		const editor = editorWith(TABLE)
		selectCells(editor, 3, 4)
		const { dom } = editor.view.serializeForClipboard(
			editor.state.selection.content()
		)

		selectCells(editor, 6, 7)
		editor.view.pasteHTML(dom.innerHTML)

		expect(saved(editor)).toContain('| Q1 2025 | 1.2M | 17% |')
	})

	it('keeps the text of an HTML table whose cells hold paragraphs', () => {
		const editor = editorWith('')
		editor.view.pasteHTML(
			'<table><tbody><tr><th><p>Quarter</p></th></tr><tr><td><p>Q1 2025</p></td></tr></tbody></table>'
		)

		expect(saved(editor)).toContain('| Q1 2025 |')
	})

	it('keeps alignment when a copied table is pasted back', () => {
		const aligned = ['| Revenue |', '| ---: |', '| 1.2M |'].join('\n')
		const editor = editorWith(aligned)
		editor.commands.selectAll()
		const copied = editor.view.serializeForClipboard(
			editor.state.selection.content()
		).text

		editor.commands.setContent('')
		pasteText(editor, copied)

		expect(saved(editor)).toBe(aligned)
	})

	// Anything without a `text/html` flavour reaches this parser - terminal
	// output, a plain editor, most CLI tools - so it only reinterprets text
	// that carries block structure. Inline syntax is left to the paste rules,
	// which is a separate decision made in `italic-extension.ts` and its like.
	it('pastes a link written in markdown as the characters themselves', () => {
		const editor = editorWith('')
		pasteText(editor, 'See [the guide](https://example.com) for details')

		expect(editor.state.doc.textContent).toBe(
			'See [the guide](https://example.com) for details'
		)
	})

	it('pastes an underlined line as two lines, not as a heading', () => {
		const editor = editorWith('')
		pasteText(editor, 'Revenue\n=======')

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.textContent).toContain('=======')
	})

	it('pastes an indented block as text, not as a code block', () => {
		const editor = editorWith('')
		pasteText(editor, 'Totals:\n\n    revenue = 1200000')

		expect(saved(editor)).not.toContain('```')
		expect(editor.state.doc.textContent).toContain('revenue = 1200000')
	})

	it('pastes markdown syntax into a code block as the characters themselves', () => {
		const editor = editorWith('```\nconst revenue = 1\n```')
		// Inside the fence: the document also has the trailing paragraph TipTap
		// keeps after a block node, and the caret has to miss it.
		editor.commands.setTextSelection(5)
		pasteText(editor, '# Not a heading')

		expect(editor.state.doc.textContent).toContain('# Not a heading')
	})
})
