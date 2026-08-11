import { TableMap } from '@tiptap/pm/tables'
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

/**
 * A live editor with the caret in one cell of the note's only table, numbered
 * in reading order - 0 is the first header cell, 3 the first body cell.
 */
function editorInCell(markdown: string, cell: number): Editor {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)

	const map = TableMap.get(editor.state.doc.firstChild!)
	editor.commands.setTextSelection(map.map[cell] + 2)

	return editor
}

/** What the note would be saved as right now. */
function saved(editor: Editor): string {
	return String(editor.storage.markdown.getMarkdown()).trimEnd()
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('moveColumn', () => {
	it('moves a column and everything under it', () => {
		const editor = editorInCell(TABLE, 2)
		editor.commands.moveColumn(2, 0)

		expect(saved(editor)).toBe(
			[
				'| Growth | Quarter | Revenue |',
				'| --- | --- | --- |',
				'| 8% | Q1 2025 | 1.2M |',
				'| 17% | Q2 2025 | 1.4M |',
			].join('\n')
		)
	})

	it('carries the column alignment along with it', () => {
		const editor = editorInCell(
			['| Left | Right |', '| :--- | ---: |', '| a | b |'].join('\n'),
			0
		)
		editor.commands.moveColumn(0, 1)

		expect(saved(editor)).toBe(
			['| Right | Left |', '| ---: | :--- |', '| b | a |'].join('\n')
		)
	})
})

describe('moveRow', () => {
	it('moves a body row', () => {
		const editor = editorInCell(TABLE, 3)
		editor.commands.moveRow(2, 1)

		expect(saved(editor)).toBe(
			[
				'| Quarter | Revenue | Growth |',
				'| --- | --- | --- |',
				'| Q2 2025 | 1.4M | 17% |',
				'| Q1 2025 | 1.2M | 8% |',
			].join('\n')
		)
	})
})

describe('setColumnAlignment', () => {
	it('aligns the whole column the caret is in, header included', () => {
		const editor = editorInCell(TABLE, 7)
		editor.commands.setColumnAlignment('center')

		expect(saved(editor)).toContain('| --- | :---: | --- |')
	})

	it('clears the alignment again', () => {
		const editor = editorInCell(
			['| Revenue |', '| ---: |', '| 1.2M |'].join('\n'),
			1
		)
		editor.commands.setColumnAlignment(null)

		expect(saved(editor)).toContain('| --- |')
	})

	it('leaves the other columns alone', () => {
		const editor = editorInCell(TABLE, 0)
		editor.commands.setColumnAlignment('right')

		expect(saved(editor)).toContain('| ---: | --- | --- |')
	})
})
