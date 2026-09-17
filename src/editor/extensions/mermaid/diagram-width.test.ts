import { describe, expect, it } from 'vitest'

import { diagramWidth } from '#src/editor/extensions/mermaid/diagram-width'

describe('diagramWidth', () => {
	it('reads the width mermaid laid the diagram out at from its viewBox', () => {
		const svg =
			'<svg aria-roledescription="flowchart-v2" viewBox="0 0 342.5 173" width="100%" style="max-width: 342.5px;"></svg>'

		expect(diagramWidth(svg)).toBe(342.5)
	})

	// Mermaid pads the viewBox by shifting its origin negative, so the third
	// value is the full width and the first is not part of it.
	it('takes the viewBox width rather than its offset origin', () => {
		const svg =
			'<svg aria-roledescription="sequence" viewBox="-8 -8 358 189"></svg>'

		expect(diagramWidth(svg)).toBe(358)
	})

	it('falls back to the cap mermaid wrote itself when there is no viewBox', () => {
		const svg =
			'<svg aria-roledescription="pie" width="100%" style="max-width: 984px;"></svg>'

		expect(diagramWidth(svg)).toBe(984)
	})

	it('reports no width when the markup states none', () => {
		expect(diagramWidth('<svg><g></g></svg>')).toBeUndefined()
	})

	it('reports no width when it is not a number', () => {
		const svg = '<svg viewBox="0 0 auto 173" style="max-width: auto;"></svg>'

		expect(diagramWidth(svg)).toBeUndefined()
	})
})
