import { describe, expect, it } from 'vitest'

import { SEQUENCE_SVG } from '#src/editor/extensions/mermaid/drawio/svg-fixtures'
import { svgToDrawio } from '#src/editor/extensions/mermaid/drawio/svg-to-drawio'
import { geometryOf, parseModel } from '#src/test-utils/drawio-model'

describe('svgToDrawio image fallback', () => {
	it('embeds a diagram type with no native mapping as one image sized by its viewBox', () => {
		const doc = parseModel(svgToDrawio(SEQUENCE_SVG))
		const vertices = Array.from(doc.querySelectorAll('mxCell[vertex="1"]'))

		expect(vertices).toHaveLength(1)
		expect(geometryOf(vertices[0] as Element)).toMatchObject({
			width: '450',
			height: '300',
		})
	})

	// draw.io's style string is `;`-separated, so its data URIs drop the
	// `;base64` marker; the payload is still base64.
	it('carries the original SVG as the image so nothing is lost', () => {
		const doc = parseModel(svgToDrawio(SEQUENCE_SVG))
		const style = doc.querySelector('mxCell[vertex="1"]')?.getAttribute('style')

		const payload = style?.split('image=data:image/svg+xml,')[1]?.split(';')[0]

		expect(style).toContain('shape=image')
		expect(atob(payload ?? '')).toBe(SEQUENCE_SVG)
	})

	it('embeds the image when a flowchart has no recognisable nodes', () => {
		const doc = parseModel(
			svgToDrawio('<svg aria-roledescription="flowchart-v2"></svg>')
		)

		expect(doc.querySelectorAll('mxCell[vertex="1"]')).toHaveLength(1)
	})
})
