import { describe, expect, it } from 'vitest'

import { FLOWCHART_SVG } from '#src/editor/extensions/mermaid/drawio/svg-fixtures'
import { svgToDrawio } from '#src/editor/extensions/mermaid/drawio/svg-to-drawio'
import { findCell, parseModel } from '#src/test-utils/drawio-model'

describe('svgToDrawio edges', () => {
	it('connects edges to the nodes they join so they follow when moved', () => {
		const doc = parseModel(svgToDrawio(FLOWCHART_SVG))
		const start = findCell(doc, 'Start').getAttribute('id')
		const decision = findCell(doc, 'Ship it?').getAttribute('id')
		const done = findCell(doc, 'Done').getAttribute('id')

		const edges = Array.from(doc.querySelectorAll('mxCell[edge="1"]'))

		expect(
			edges.map((edge) => [
				edge.getAttribute('source'),
				edge.getAttribute('target'),
			])
		).toEqual([
			[start, decision],
			[decision, done],
		])
	})

	it('carries an edge label onto its edge', () => {
		const doc = parseModel(svgToDrawio(FLOWCHART_SVG))
		const [labelled, unlabelled] = Array.from(
			doc.querySelectorAll('mxCell[edge="1"]')
		)

		expect(labelled?.getAttribute('value')).toBe('go')
		expect(unlabelled?.getAttribute('value')).toBe('')
	})

	it('keeps the interior bends of an edge as waypoints', () => {
		const doc = parseModel(svgToDrawio(FLOWCHART_SVG))
		const [firstEdge] = Array.from(doc.querySelectorAll('mxCell[edge="1"]'))

		const waypoints = Array.from(
			firstEdge?.querySelectorAll('Array[as="points"] mxPoint') ?? []
		).map((point) => [point.getAttribute('x'), point.getAttribute('y')])

		expect(waypoints).toEqual([['136.33', '60.76']])
	})
})
