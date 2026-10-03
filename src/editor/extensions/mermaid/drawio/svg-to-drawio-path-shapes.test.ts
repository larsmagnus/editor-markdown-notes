import { afterEach, describe, expect, it } from 'vitest'

import { svgToDrawio } from '#src/editor/extensions/mermaid/drawio/svg-to-drawio'
import { findCell, geometryOf, parseModel } from '#src/test-utils/drawio-model'

// Mermaid draws a cylinder or a stadium as a `path`, which has no box in its
// attributes - only a layout engine can measure it, and happy-dom has none.
const CYLINDER_SVG = `<svg id="m-cyl" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" aria-roledescription="flowchart-v2"><g><g class="root"><g class="clusters"></g><g class="edgePaths"></g><g class="edgeLabels"></g><g class="nodes"><g class="node default" id="m-cyl-flowchart-A-0" transform="translate(100, 100)"><path class="basic label-container outer-path" d="M0,9 a40,9 0,0,0 80,0" transform="translate(-40, -34)"></path><g class="label" transform="translate(-20, -12)"><foreignObject width="40" height="24"><div><span class="nodeLabel"><p>Orders</p></span></div></foreignObject></g></g></g></g></g></svg>`

const originalGetBBox = Object.getOwnPropertyDescriptor(
	SVGGraphicsElement.prototype,
	'getBBox'
)

afterEach(() => {
	if (originalGetBBox) {
		Object.defineProperty(
			SVGGraphicsElement.prototype,
			'getBBox',
			originalGetBBox
		)
	} else {
		Reflect.deleteProperty(SVGGraphicsElement.prototype, 'getBBox')
	}
})

function stubBBox(box: {
	x: number
	y: number
	width: number
	height: number
}) {
	Object.defineProperty(SVGGraphicsElement.prototype, 'getBBox', {
		configurable: true,
		value: () => box,
	})
}

describe('svgToDrawio path shapes', () => {
	it('sizes a path-drawn node by its measured box and its own offset', () => {
		stubBBox({ x: 0, y: 0, width: 80, height: 68 })

		const doc = parseModel(
			svgToDrawio(CYLINDER_SVG, new Map([['A', 'cylinder']]))
		)

		expect(geometryOf(findCell(doc, 'Orders'))).toEqual({
			x: '60',
			y: '66',
			width: '80',
			height: '68',
		})
	})

	it('styles the node from the type the parser reported', () => {
		stubBBox({ x: 0, y: 0, width: 80, height: 68 })

		const doc = parseModel(
			svgToDrawio(CYLINDER_SVG, new Map([['A', 'cylinder']]))
		)

		expect(findCell(doc, 'Orders').getAttribute('style')).toContain(
			'shape=cylinder3'
		)
	})

	it('falls back to a box around the label when nothing can be measured', () => {
		stubBBox({ x: 0, y: 0, width: 0, height: 0 })

		const doc = parseModel(
			svgToDrawio(CYLINDER_SVG, new Map([['A', 'cylinder']]))
		)

		expect(geometryOf(findCell(doc, 'Orders'))).toEqual({
			x: '70',
			y: '78',
			width: '60',
			height: '44',
		})
	})
})
