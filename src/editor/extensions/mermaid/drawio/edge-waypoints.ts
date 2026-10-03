import { z } from 'zod'

import type { Point } from '#src/editor/extensions/mermaid/drawio/cells'
import { absoluteOffset } from '#src/editor/extensions/mermaid/drawio/svg-transform'

const PointsSchema = z.array(z.object({ x: z.number(), y: z.number() }))

/** Mermaid ships an edge's route as base64 JSON in `data-points`. */
function decodePoints(encoded: string): Point[] {
	try {
		return PointsSchema.parse(JSON.parse(atob(encoded)))
	} catch {
		return []
	}
}

/**
 * The bends of an edge. The first and last points sit on the node borders,
 * which draw.io works out itself from the connected cells.
 */
export function waypointsOf(path: Element) {
	const offset = absoluteOffset(path)
	return decodePoints(path.getAttribute('data-points') ?? '')
		.slice(1, -1)
		.map((point) => ({ x: point.x + offset.x, y: point.y + offset.y }))
}
