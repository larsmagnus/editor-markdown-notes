import { describe, expect, it } from 'vitest'

import { vertexStyle } from '#src/editor/extensions/mermaid/drawio/vertex-style'

// One row per node type mermaid's flowchart parser reports, so a new type
// that nobody maps fails loudly here rather than drawing as a plain box.
describe('vertexStyle', () => {
	it.each([
		['square', 'whiteSpace=wrap'],
		['round', 'rounded=1'],
		['stadium', 'arcSize=50'],
		['diamond', 'rhombus'],
		['hexagon', 'shape=hexagon'],
		['circle', 'ellipse'],
		['doublecircle', 'shape=doubleEllipse'],
		['cylinder', 'shape=cylinder3'],
		['cyl', 'shape=cylinder3'],
		['subroutine', 'shape=process'],
		['lean_right', 'shape=parallelogram'],
		['lean_left', 'flipH=1'],
		['trapezoid', 'shape=trapezoid'],
		['inv_trapezoid', 'flipV=1'],
	])('draws a %s node with %s', (type, expected) => {
		expect(vertexStyle(type)).toContain(expected)
	})

	it('draws a node of unknown type as a plain box', () => {
		expect(vertexStyle(undefined)).toBe('whiteSpace=wrap')
		expect(vertexStyle('odd')).toBe('whiteSpace=wrap')
	})
})
