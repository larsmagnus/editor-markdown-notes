import { describe, expect, it } from 'vitest'

import {
	FLOWCHART_SVG,
	SUBGRAPH_SVG,
} from '#src/editor/extensions/mermaid/drawio/svg-fixtures'
import { svgToDrawio } from '#src/editor/extensions/mermaid/drawio/svg-to-drawio'
import { findCell, parseModel } from '#src/test-utils/drawio-model'

// Mermaid colours nodes through a stylesheet scoped to the diagram's id, and
// only a node the author styled carries inline style - so both routes matter.
const THEME =
	'<style>#m-flowchart .node rect{fill:#ececff;stroke:#9370db;stroke-width:1px}#m-flowchart .flowchart-link{stroke:#333333;stroke-width:1px}</style>'
const THEMED_SVG = FLOWCHART_SVG.replace(
	'<g><g class="root">',
	`${THEME}<g><g class="root">`
)

describe('svgToDrawio paint', () => {
	it('carries a node fill, stroke and stroke width from the stylesheet', () => {
		const doc = parseModel(svgToDrawio(THEMED_SVG))

		expect(findCell(doc, 'Start').getAttribute('style')).toContain(
			'fillColor=#ececff;strokeColor=#9370db;strokeWidth=1'
		)
	})

	it('prefers the inline style an author gave one node', () => {
		const doc = parseModel(
			svgToDrawio(
				THEMED_SVG.replace(
					'<rect class="basic label-container" x="-47.5078125"',
					'<rect style="fill:#f9f;stroke:#333;stroke-width:4px" class="basic label-container" x="-47.5078125"'
				)
			)
		)

		expect(findCell(doc, 'Start').getAttribute('style')).toContain(
			'fillColor=#ff99ff;strokeColor=#333333;strokeWidth=4'
		)
		expect(findCell(doc, 'Done').getAttribute('style')).toContain(
			'fillColor=#ececff'
		)
	})

	it('carries a subgraph fill and stroke', () => {
		const doc = parseModel(
			svgToDrawio(
				SUBGRAPH_SVG.replace(
					'<g><g class="root">',
					'<style>#m-subgraph .cluster rect{fill:#ffffde;stroke:#aaaa33}</style><g><g class="root">'
				)
			)
		)

		expect(findCell(doc, 'Group').getAttribute('style')).toContain(
			'fillColor=#ffffde;strokeColor=#aaaa33'
		)
	})

	it('carries an edge colour and thickness', () => {
		const doc = parseModel(
			svgToDrawio(
				THEMED_SVG.replace(
					'id="m-flowchart-L_A_B_0" class="flowchart-link"',
					'id="m-flowchart-L_A_B_0" style="stroke:#f00;stroke-width:6px" class="flowchart-link"'
				)
			)
		)
		const [thick, normal] = Array.from(doc.querySelectorAll('mxCell[edge="1"]'))

		expect(thick?.getAttribute('style')).toContain(
			'strokeColor=#ff0000;strokeWidth=6'
		)
		expect(normal?.getAttribute('style')).toContain(
			'strokeColor=#333333;strokeWidth=1'
		)
	})

	it('draws a node plain when its stylesheet colour is none', () => {
		const doc = parseModel(
			svgToDrawio(
				THEMED_SVG.replace(
					'#m-flowchart .node rect{fill:#ececff;',
					'#m-flowchart .node rect{fill:none;'
				)
			)
		)

		expect(findCell(doc, 'Start').getAttribute('style')).toContain(
			'fillColor=none'
		)
	})
})
