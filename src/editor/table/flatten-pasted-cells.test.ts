import { describe, expect, it } from 'vitest'

import { flattenPastedCells } from '@/editor/table/flatten-pasted-cells'

describe('flattenPastedCells', () => {
	it('unwraps the single paragraph other editors wrap a cell in', () => {
		const html = '<table><tr><td><p>Q1 2025</p></td></tr></table>'

		expect(flattenPastedCells(html)).toContain('<td>Q1 2025</td>')
	})

	it('joins a multi-paragraph cell with a line break', () => {
		const html = '<table><tr><td><p>Q1 2025</p><p>Q2 2025</p></td></tr></table>'

		expect(flattenPastedCells(html)).toContain('<td>Q1 2025<br>Q2 2025</td>')
	})

	it('keeps inline formatting inside the unwrapped block', () => {
		const html =
			'<table><tr><td><p>Revenue <strong>1.2M</strong></p></td></tr></table>'

		expect(flattenPastedCells(html)).toContain(
			'<td>Revenue <strong>1.2M</strong></td>'
		)
	})

	it('flattens header cells the same way', () => {
		const html = '<table><tr><th><p>Quarter</p></th></tr></table>'

		expect(flattenPastedCells(html)).toContain('<th>Quarter</th>')
	})

	it('flattens a list in a cell into one line per item', () => {
		const html =
			'<table><tr><td><ul><li>Tables</li><li>Footnotes</li></ul></td></tr></table>'

		expect(flattenPastedCells(html)).toContain('<td>Tables<br>Footnotes</td>')
	})

	// Rebuilding the cell from the blocks inside it dropped everything that was
	// not in one.
	it('keeps text that sits beside a block in the same cell', () => {
		const html = '<table><tr><td>Q1 <p>2025</p></td></tr></table>'

		expect(flattenPastedCells(html)).toContain('<td>Q1 <br>2025</td>')
	})

	it('keeps the text around a nested wrapper', () => {
		const html =
			'<table><tr><td>Total: <div><p>1.2M</p></div> so far</td></tr></table>'

		const flattened = flattenPastedCells(html)

		expect(flattened).toContain('Total: ')
		expect(flattened).toContain('1.2M')
		expect(flattened).toContain(' so far')
	})

	it('leaves a cell that already holds inline content alone', () => {
		const html = '<table><tr><td>Q1 2025</td></tr></table>'

		expect(flattenPastedCells(html)).toContain('<td>Q1 2025</td>')
	})

	it('returns html without a table untouched', () => {
		const html = '<p>Revenue is <strong>up</strong></p>'

		expect(flattenPastedCells(html)).toBe(html)
	})
})
