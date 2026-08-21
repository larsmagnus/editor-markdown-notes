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

/** The text flavour the clipboard would carry for the current selection. */
function copy(editor: Editor): string {
	return editor.view
		.serializeForClipboard(editor.state.selection.content())
		.text.trimEnd()
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('copying to the clipboard', () => {
	it('writes a whole table as GFM markdown', () => {
		const editor = editorWith(TABLE)
		editor.commands.selectAll()

		expect(copy(editor)).toBe(TABLE)
	})

	it('writes a range that includes the header as a headed table', () => {
		const editor = editorWith(TABLE)
		selectCells(editor, 0, 4)

		expect(copy(editor)).toBe(
			['| Quarter | Revenue |', '| --- | --- |', '| Q1 2025 | 1.2M |'].join(
				'\n'
			)
		)
	})

	it('writes a range of body cells as a table with an empty header', () => {
		const editor = editorWith(TABLE)
		selectCells(editor, 3, 7)

		expect(copy(editor)).toBe(
			[
				'|  |  |',
				'| --- | --- |',
				'| Q1 2025 | 1.2M |',
				'| Q2 2025 | 1.4M |',
			].join('\n')
		)
	})

	it('keeps the alignment of the copied columns', () => {
		const editor = editorWith(
			['| Revenue | Growth |', '| ---: | :---: |', '| 1.2M | 8% |'].join('\n')
		)
		editor.commands.selectAll()

		expect(copy(editor)).toContain('| ---: | :---: |')
	})

	it('writes a paragraph as markdown too, not as bare text', () => {
		const editor = editorWith('Revenue is **up** this quarter')
		editor.commands.selectAll()

		expect(copy(editor)).toBe('Revenue is **up** this quarter')
	})
})
