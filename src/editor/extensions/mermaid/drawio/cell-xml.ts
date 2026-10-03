import type {
	DrawioCell,
	Edge,
	Point,
	Vertex,
} from '#src/editor/extensions/mermaid/drawio/cells'
import {
	element,
	round,
} from '#src/editor/extensions/mermaid/drawio/xml-attributes'

/** Creates an mxCell element with geometry as a child. */
function cellXml(
	entries: Record<string, string | undefined>,
	geometry: string
) {
	return element('mxCell', { ...entries, parent: '1' }, geometry)
}

/** Converts a vertex to an mxCell element. */
function vertexXml({ id, label, style, ...box }: Vertex) {
	return cellXml(
		{ id, value: label, style, vertex: '1' },
		element('mxGeometry', {
			x: round(box.x),
			y: round(box.y),
			width: round(box.width),
			height: round(box.height),
			as: 'geometry',
		})
	)
}

/** Converts waypoints to an mxPoint array element, or empty string if none. */
function waypointsXml(waypoints: Point[]) {
	const points = waypoints.map((point) =>
		element('mxPoint', { x: round(point.x), y: round(point.y) })
	)
	return points.length
		? element('Array', { as: 'points' }, points.join(''))
		: ''
}

/** Converts an edge to an mxCell element with waypoints. */
function edgeXml({ id, label, style, source, target, waypoints }: Edge) {
	return cellXml(
		{ id, value: label, style, edge: '1', source, target },
		element(
			'mxGeometry',
			{ relative: '1', as: 'geometry' },
			waypointsXml(waypoints)
		)
	)
}

/** One cell as draw.io XML. */
export function cellToXml(cell: DrawioCell) {
	return cell.kind === 'vertex' ? vertexXml(cell) : edgeXml(cell)
}
