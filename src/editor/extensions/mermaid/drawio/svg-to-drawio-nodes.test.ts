import { describe, expect, it } from 'vitest'

import {
	FLOWCHART_SVG,
	SPECIAL_CHARACTERS_SVG,
} from '#src/editor/extensions/mermaid/drawio/svg-fixtures'
import { svgToDrawio } from '#src/editor/extensions/mermaid/drawio/svg-to-drawio'
import { findCell, geometryOf, parseModel } from '#src/test-utils/drawio-model'

describe('svgToDrawio nodes', () => {
	it('emits a draw.io model rooted on the two default layers', () => {
		const doc = parseModel(svgToDrawio(FLOWCHART_SVG))

		expect(doc.documentElement.tagName).toBe('mxGraphModel')
		expect(doc.querySelector('mxCell[id="0"]')).not.toBeNull()
		expect(doc.querySelector('mxCell[id="1"]')?.getAttribute('parent')).toBe(
			'0'
		)
	})

	it('turns each node into a labelled vertex', () => {
		const doc = parseModel(svgToDrawio(FLOWCHART_SVG))

		for (const label of ['Start', 'Ship it?', 'Done']) {
			const cell = findCell(doc, label)
			expect(cell.getAttribute('vertex')).toBe('1')
			expect(cell.getAttribute('parent')).toBe('1')
		}
	})

	it('places a node by its transform plus its own offset', () => {
		const doc = parseModel(svgToDrawio(FLOWCHART_SVG))

		expect(geometryOf(findCell(doc, 'Start'))).toEqual({
			x: '8',
			y: '33.76',
			width: '95.02',
			height: '54',
		})
	})

	it('draws a decision node as a rhombus spanning its polygon', () => {
		const doc = parseModel(
			svgToDrawio(FLOWCHART_SVG, new Map([['B', 'diamond']]))
		)
		const decision = findCell(doc, 'Ship it?')

		expect(decision.getAttribute('style')).toContain('rhombus')
		expect(geometryOf(decision)).toEqual({
			x: '170.14',
			y: '8',
			width: '105.52',
			height: '105.52',
		})
	})

	it('rounds the corners of a node mermaid rounded', () => {
		const doc = parseModel(
			svgToDrawio(FLOWCHART_SVG, new Map([['C', 'round']]))
		)

		expect(findCell(doc, 'Done').getAttribute('style')).toContain('rounded=1')
		expect(findCell(doc, 'Start').getAttribute('style')).not.toContain(
			'rounded=1'
		)
	})

	// Labels are plain text cells, so the only escaping owed is XML's - a bad
	// one makes draw.io reject the whole paste.
	it('survives label characters that are special in XML', () => {
		const doc = parseModel(svgToDrawio(SPECIAL_CHARACTERS_SVG))

		expect(findCell(doc, 'a < b & c').getAttribute('vertex')).toBe('1')
		expect(findCell(doc, 'say "hi"').getAttribute('vertex')).toBe('1')
	})
})
