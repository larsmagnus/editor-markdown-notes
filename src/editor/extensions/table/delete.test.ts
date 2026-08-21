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
 * A mounted editor with a rectangle of its table's cells selected, numbered in
 * reading order - 0 is the first header cell, 3 the first body cell.
 */
function editorSelecting(anchor: number, head: number): Editor {
	const element = document.body.appendChild(document.createElement('div'))
	const editor = new Editor({ element, extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(TABLE)

	const { doc, tr } = editor.state
	const map = TableMap.get(doc.firstChild!)
	const cell = (index: number) => doc.resolve(1 + map.map[index])
	editor.view.dispatch(
		tr.setSelection(new CellSelection(cell(anchor), cell(head)))
	)

	return editor
}

/** Presses a key the way the browser does, so the keymap plugins see it. */
function press(editor: Editor, key: string): void {
	editor.view.dom.dispatchEvent(
		new KeyboardEvent('keydown', { key, bubbles: true })
	)
}

/** What the note would be saved as right now. */
function saved(editor: Editor): string {
	return String(editor.storage.markdown.getMarkdown()).trimEnd()
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
	document.body.innerHTML = ''
})

describe('backspace over selected cells', () => {
	it('empties the cells when only part of a row is selected', () => {
		const editor = editorSelecting(3, 4)

		press(editor, 'Backspace')

		expect(saved(editor)).toBe(
			[
				'| Quarter | Revenue | Growth |',
				'| --- | --- | --- |',
				'|  |  | 8% |',
				'| Q2 2025 | 1.4M | 17% |',
			].join('\n')
		)
	})

	it('deletes the row when the whole row is selected', () => {
		const editor = editorSelecting(3, 5)

		press(editor, 'Backspace')

		expect(saved(editor)).toBe(
			[
				'| Quarter | Revenue | Growth |',
				'| --- | --- | --- |',
				'| Q2 2025 | 1.4M | 17% |',
			].join('\n')
		)
	})

	it('deletes the column when the whole column is selected', () => {
		const editor = editorSelecting(1, 7)

		press(editor, 'Backspace')

		expect(saved(editor)).toBe(
			[
				'| Quarter | Growth |',
				'| --- | --- |',
				'| Q1 2025 | 8% |',
				'| Q2 2025 | 17% |',
			].join('\n')
		)
	})

	it('deletes the table when every cell is selected', () => {
		const editor = editorSelecting(0, 8)

		press(editor, 'Backspace')

		expect(saved(editor)).toBe('')
	})
})
