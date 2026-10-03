import { expect } from 'vitest'

/** Parses draw.io XML, failing the test if it is not well-formed. */
export function parseModel(xml: string) {
	const doc = new DOMParser().parseFromString(xml, 'text/xml')
	expect(doc.querySelector('parsererror')).toBeNull()
	return doc
}

/** The cell carrying `value` as its label. */
export function findCell(doc: Document, value: string) {
	const cell = Array.from(doc.querySelectorAll('mxCell')).find(
		(candidate) => candidate.getAttribute('value') === value
	)
	if (!cell) throw new Error(`No cell labelled "${value}"`)
	return cell
}

/** A cell's geometry attributes exactly as they were written. */
export function geometryOf(cell: Element) {
	const geometry = cell.querySelector('mxGeometry')
	if (!geometry) throw new Error('Cell has no geometry')
	return {
		x: geometry.getAttribute('x'),
		y: geometry.getAttribute('y'),
		width: geometry.getAttribute('width'),
		height: geometry.getAttribute('height'),
	}
}
