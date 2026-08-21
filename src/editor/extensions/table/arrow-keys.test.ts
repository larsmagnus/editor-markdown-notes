import { CellSelection, TableMap } from '@tiptap/pm/tables'
import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

const TABLE = [
	'| Quarter | Revenue | Growth |',
	'| --- | --- | --- |',
	'| Q1 2025 | 1.2M | 8% |',
	'| Q2 2025 | 1.4M | 17% |',
].join('\n')

const editors: Editor[] = []

/**
 * A mounted editor: these are keyboard behaviours, and the keymap only runs on
 * events the view's own DOM node receives.
 */
function editorWith(markdown: string): Editor {
	const element = document.body.appendChild(document.createElement('div'))
	const editor = new Editor({ element, extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)

	return editor
}

/**
 * Puts the caret at the head of one cell of the note's first table, numbered in
 * reading order - 0 is the first header cell, 3 the first body cell.
 */
function caretInCell(editor: Editor, cell: number, offset = 0): void {
	const table = editor.state.doc.firstChild!
	const map = TableMap.get(table)
	editor.commands.setTextSelection(map.map[cell] + 2 + offset)
}

/** Presses a key the way the browser does, so the keymap plugins see it. */
function press(editor: Editor, key: string, shiftKey = false): void {
	editor.view.dom.dispatchEvent(
		new KeyboardEvent('keydown', { key, shiftKey, bubbles: true })
	)
}

/** The text of whatever block the caret is in. */
function caretIn(editor: Editor): string {
	return editor.state.selection.$head.parent.textContent
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
	document.body.innerHTML = ''
})

describe('moving the caret', () => {
	// Cells hold inline content, which makes them textblocks - and that is what
	// prosemirror-gapcursor reads to decide a gap between cells is one a
	// paragraph could fill. It drew a cursor inside the row instead.
	it('never leaves a gap cursor between the cells of a row', () => {
		const editor = editorWith(TABLE)
		caretInCell(editor, 3)

		press(editor, 'ArrowDown')

		expect(editor.state.selection.constructor.name).not.toBe('GapCursor')
		expect(editor.view.dom.querySelector('.ProseMirror-gapcursor')).toBeNull()
	})

	// Left to the browser this lands in the cell beside it rather than the one
	// under it: a cell is itself the textblock, so with no line below the caret
	// the next position in the document wins.
	it('goes down the column, not on to the next cell in the row', () => {
		const editor = editorWith(TABLE)
		caretInCell(editor, 3, 7)

		press(editor, 'ArrowDown')

		expect(caretIn(editor)).toBe('Q2 2025')
	})

	it('goes up the column the same way', () => {
		const editor = editorWith(TABLE)
		caretInCell(editor, 6)

		press(editor, 'ArrowUp')

		expect(caretIn(editor)).toBe('Q1 2025')
	})

	// Left to the browser this went sideways into the next cell of the same row,
	// for the same reason as above: the next position in the document.
	it('leaves the table when there is no row below to go to', () => {
		const editor = editorWith(`${TABLE}\n\nAfter the table.`)
		caretInCell(editor, 6, 7)

		press(editor, 'ArrowDown')

		expect(caretIn(editor)).toBe('After the table.')
	})

	// A table with nothing above it has no block to reach, so the caret lands in
	// the gap before it - the one position a gap cursor is genuinely for, and
	// the only way to write above a note that opens on a table.
	it('leaves upwards into the gap before a table that opens the note', () => {
		const editor = editorWith(TABLE)
		caretInCell(editor, 0)

		press(editor, 'ArrowUp')

		expect(editor.state.selection.$head.parent.type.name).not.toBe(
			'tableHeader'
		)
		expect(editor.state.selection.head).toBe(0)
	})

	// The last cell has no text position after it inside the table, so the search
	// for the nearest one ran backwards and landed before the table.
	it('leaves the last cell forwards, not backwards', () => {
		const editor = editorWith(`${TABLE}\n\nAfter the table.`)
		// The end of "17%", the last cell of the last row.
		caretInCell(editor, 8, 3)

		press(editor, 'ArrowRight')

		expect(caretIn(editor)).toBe('After the table.')
	})

	it('leaves the first cell backwards, into the block before the table', () => {
		const editor = editorWith(`Before the table.\n\n${TABLE}`)
		const tableStart = editor.state.doc.child(0).nodeSize

		// The head of the first header cell: table, row, cell.
		editor.commands.setTextSelection(tableStart + 3)
		press(editor, 'ArrowLeft')

		expect(caretIn(editor)).toBe('Before the table.')
	})
})

describe('shift and an arrow', () => {
	it('selects both cells when shift-right runs out of text', () => {
		const editor = editorWith(TABLE)
		caretInCell(editor, 3, 7)

		press(editor, 'ArrowRight', true)

		expect(editor.state.selection).toBeInstanceOf(CellSelection)
		expect(editor.view.dom.querySelectorAll('.selectedCell')).toHaveLength(2)
	})

	it('leaves shift-right to the text while there is still text to select', () => {
		const editor = editorWith(TABLE)
		caretInCell(editor, 3)

		press(editor, 'ArrowRight', true)

		expect(editor.state.selection).not.toBeInstanceOf(CellSelection)
	})

	// Down the column, like the unshifted arrow - `prosemirror-tables`' own
	// shift-arrow cannot find our cells, so this used to fall through to the
	// browser and take the next cell along the row instead.
	it('selects down the column when shift-down runs out of text', () => {
		const editor = editorWith(TABLE)
		caretInCell(editor, 3, 7)

		press(editor, 'ArrowDown', true)

		expect(editor.state.selection).toBeInstanceOf(CellSelection)
		expect(
			Array.from(editor.view.dom.querySelectorAll('.selectedCell')).map(
				(cell) => cell.textContent
			)
		).toEqual(['Q1 2025', 'Q2 2025'])
	})

	it('selects up the column at the head of a cell', () => {
		const editor = editorWith(TABLE)
		caretInCell(editor, 6)

		press(editor, 'ArrowUp', true)

		expect(
			Array.from(editor.view.dom.querySelectorAll('.selectedCell')).map(
				(cell) => cell.textContent
			)
		).toEqual(['Q1 2025', 'Q2 2025'])
	})

	it('takes the cell before it with shift-left at the head of a cell', () => {
		const editor = editorWith(TABLE)
		caretInCell(editor, 4)

		press(editor, 'ArrowLeft', true)

		expect(editor.state.selection).toBeInstanceOf(CellSelection)
		expect(editor.view.dom.querySelectorAll('.selectedCell')).toHaveLength(2)
	})
})
