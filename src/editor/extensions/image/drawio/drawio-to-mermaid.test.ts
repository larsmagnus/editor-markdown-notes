import { describe, expect, it } from 'vitest'

import { drawioFile } from '#src/editor/extensions/image/drawio/drawio-fixtures'
import { drawioToMermaid } from '#src/editor/extensions/image/drawio/drawio-to-mermaid'

describe('drawioToMermaid', () => {
	it('joins nodes with an arrow', () => {
		const xml = drawioFile([
			{ id: 'a', value: 'Start' },
			{ id: 'b', value: 'Done', x: 200 },
			{ id: 'e', source: 'a', target: 'b' },
		])

		expect(drawioToMermaid(xml)).toBe(
			['flowchart LR', '  n1["Start"]', '  n2["Done"]', '  n1 --> n2'].join(
				'\n'
			)
		)
	})

	it('lays out top-down when the diagram grows downwards', () => {
		const xml = drawioFile([
			{ id: 'a', value: 'Start' },
			{ id: 'b', value: 'Done', y: 200 },
			{ id: 'e', source: 'a', target: 'b' },
		])

		expect(drawioToMermaid(xml)?.split('\n')[0]).toBe('flowchart TD')
	})

	it.each([
		['rounded=1;whiteSpace=wrap;', 'n1("Step")'],
		['ellipse;whiteSpace=wrap;', 'n1(("Step"))'],
		['rhombus;whiteSpace=wrap;', 'n1{"Step"}'],
		['shape=hexagon;perimeter=hexagonPerimeter2;', 'n1{{"Step"}}'],
		['shape=cylinder3;whiteSpace=wrap;', 'n1[("Step")]'],
		['shape=parallelogram;perimeter=parallelogramPerimeter;', 'n1[/"Step"/]'],
		['whiteSpace=wrap;html=1;', 'n1["Step"]'],
	])('draws a node styled %s as %s', (style, expected) => {
		const xml = drawioFile([{ id: 'a', value: 'Step', style }])

		expect(drawioToMermaid(xml)).toContain(`  ${expected}`)
	})

	it('labels an edge', () => {
		const xml = drawioFile([
			{ id: 'a', value: 'Start' },
			{ id: 'b', value: 'Done', x: 200 },
			{ id: 'e', value: 'go', source: 'a', target: 'b' },
		])

		expect(drawioToMermaid(xml)).toContain('n1 -->|"go"| n2')
	})

	it.each([
		['endArrow=none;', 'n1 --- n2'],
		['dashed=1;', 'n1 -.-> n2'],
		['dashed=1;endArrow=none;', 'n1 -.- n2'],
	])('draws an edge styled %s as %s', (style, expected) => {
		const xml = drawioFile([
			{ id: 'a', value: 'Start' },
			{ id: 'b', value: 'Done', x: 200 },
			{ id: 'e', style, source: 'a', target: 'b' },
		])

		expect(drawioToMermaid(xml)).toContain(`  ${expected}`)
	})

	it('drops an edge that is not attached at both ends', () => {
		const xml = drawioFile([
			{ id: 'a', value: 'Start' },
			{ id: 'e', source: 'a' },
		])

		expect(drawioToMermaid(xml)).not.toContain('-->')
	})

	it('nests the cells of a container in a subgraph', () => {
		const xml = drawioFile([
			{ id: 'g', value: 'Backend', style: 'swimlane;' },
			{ id: 'a', value: 'API', parent: 'g' },
			{ id: 'b', value: 'Browser', x: 300 },
			{ id: 'e', source: 'b', target: 'a' },
		])

		expect(drawioToMermaid(xml)).toBe(
			[
				'flowchart LR',
				'  subgraph n1["Backend"]',
				'    n2["API"]',
				'  end',
				'  n3["Browser"]',
				'  n3 --> n2',
			].join('\n')
		)
	})

	it('flattens html labels to text', () => {
		const xml = drawioFile([
			{
				id: 'a',
				value: '&lt;b&gt;Auth&lt;/b&gt;&lt;br&gt;service',
				style: 'html=1;',
			},
		])

		expect(drawioToMermaid(xml)).toContain('n1["Auth<br/>service"]')
	})

	it('keeps a quote in a label from ending it', () => {
		const xml = drawioFile([{ id: 'a', value: 'say &quot;hi&quot;' }])

		expect(drawioToMermaid(xml)).toContain('n1["say #quot;hi#quot;"]')
	})

	it('has nothing to say about a page without nodes', () => {
		expect(drawioToMermaid(drawioFile([]))).toBeNull()
	})

	it('has nothing to say about text that is not draw.io', () => {
		expect(drawioToMermaid('not xml at all')).toBeNull()
	})

	// draw.io moves `id` and `label` onto an <object> or <UserObject> wrapper
	// once a shape has a link, tooltip or custom property.
	it.each(['object', 'UserObject'])(
		'reads a node and its label from a <%s> wrapper',
		(tag) => {
			const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
				<${tag} id="a" label="Docs" link="https://example.com"><mxCell style="rounded=1;" vertex="1" parent="1"><mxGeometry x="0" y="0" width="80" height="40" as="geometry"/></mxCell></${tag}>
				<mxCell id="b" value="Done" vertex="1" parent="1"><mxGeometry x="200" y="0" width="80" height="40" as="geometry"/></mxCell>
				<mxCell id="e" edge="1" parent="1" source="a" target="b"><mxGeometry relative="1" as="geometry"/></mxCell>
			</root></mxGraphModel>`

			expect(drawioToMermaid(xml)).toBe(
				['flowchart LR', '  n1("Docs")', '  n2["Done"]', '  n1 --> n2'].join(
					'\n'
				)
			)
		}
	)

	it('reads an edge label from a wrapper', () => {
		const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
			<mxCell id="a" value="Start" vertex="1" parent="1"><mxGeometry x="0" y="0" width="80" height="40" as="geometry"/></mxCell>
			<mxCell id="b" value="Done" vertex="1" parent="1"><mxGeometry x="200" y="0" width="80" height="40" as="geometry"/></mxCell>
			<object id="e" label="go"><mxCell edge="1" parent="1" source="a" target="b"><mxGeometry relative="1" as="geometry"/></mxCell></object>
		</root></mxGraphModel>`

		expect(drawioToMermaid(xml)).toContain('n1 -->|"go"| n2')
	})
})
