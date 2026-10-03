import { describe, expect, it } from 'vitest'

import { SUBGRAPH_SVG } from '#src/editor/extensions/mermaid/drawio/svg-fixtures'
import { svgToDrawio } from '#src/editor/extensions/mermaid/drawio/svg-to-drawio'
import { findCell, geometryOf, parseModel } from '#src/test-utils/drawio-model'

describe('svgToDrawio subgraph', () => {
	it('draws the group as a labelled container behind its members', () => {
		const doc = parseModel(svgToDrawio(SUBGRAPH_SVG))
		const cells = Array.from(doc.querySelectorAll('mxCell'))
		const group = findCell(doc, 'Group')

		expect(geometryOf(group)).toEqual({
			x: '8',
			y: '8',
			width: '325.83',
			height: '124',
		})
		expect(cells.indexOf(group)).toBeLessThan(
			cells.indexOf(findCell(doc, 'One'))
		)
		expect(cells.indexOf(group)).toBeLessThan(
			cells.indexOf(findCell(doc, 'Two'))
		)
	})

	it('connects edges inside the group', () => {
		const doc = parseModel(svgToDrawio(SUBGRAPH_SVG))
		const edge = doc.querySelector('mxCell[edge="1"]')

		expect(edge?.getAttribute('source')).toBe(
			findCell(doc, 'One').getAttribute('id')
		)
		expect(edge?.getAttribute('target')).toBe(
			findCell(doc, 'Two').getAttribute('id')
		)
	})

	it('offsets members by the nested group transform', () => {
		const doc = parseModel(
			svgToDrawio(
				SUBGRAPH_SVG.replace(
					'<g class="root" transform="translate(0, 0)">',
					'<g class="root" transform="translate(10, 20)">'
				)
			)
		)

		expect(geometryOf(findCell(doc, 'One'))).toMatchObject({
			x: '55.5',
			y: '63',
		})
	})
})
