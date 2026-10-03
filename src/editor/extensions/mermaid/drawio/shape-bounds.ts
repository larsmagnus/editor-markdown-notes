import type { Point } from '#src/editor/extensions/mermaid/drawio/cells'
import { absoluteOffset } from '#src/editor/extensions/mermaid/drawio/svg-transform'

type Bounds = Point & { width: number; height: number }

/** Reads a numeric attribute from an element, defaulting to 0. */
function numberAttribute(element: Element, name: string) {
	return Number(element.getAttribute(name) ?? 0)
}

/** A polygon's vertices in its own coordinates. */
function polygonPoints(polygon: Element): Point[] {
	return (polygon.getAttribute('points') ?? '')
		.trim()
		.split(/\s+/)
		.map((pair) => {
			const [x = 0, y = 0] = pair.split(',').map(Number)
			return { x, y }
		})
}

/** Computes bounding box from polygon vertices. */
function polygonBounds(polygon: Element): Bounds {
	const points = polygonPoints(polygon)
	const xs = points.map((point) => point.x)
	const ys = points.map((point) => point.y)
	const x = Math.min(...xs)
	const y = Math.min(...ys)
	return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

/** Computes bounding box from circle or ellipse center and radii. */
function ellipseBounds(shape: Element): Bounds {
	const rx = numberAttribute(shape, 'rx') || numberAttribute(shape, 'r')
	const ry = numberAttribute(shape, 'ry') || numberAttribute(shape, 'r')
	return {
		x: numberAttribute(shape, 'cx') - rx,
		y: numberAttribute(shape, 'cy') - ry,
		width: rx * 2,
		height: ry * 2,
	}
}

const BOUNDS_BY_TAG: Record<string, (shape: Element) => Bounds> = {
	rect: (shape) => ({
		x: numberAttribute(shape, 'x'),
		y: numberAttribute(shape, 'y'),
		width: numberAttribute(shape, 'width'),
		height: numberAttribute(shape, 'height'),
	}),
	polygon: polygonBounds,
	circle: ellipseBounds,
	ellipse: ellipseBounds,
}

/** The box the layout engine measured, if there is one to ask. */
function measuredBounds(shape: Element): Bounds | undefined {
	if (!('getBBox' in shape) || typeof shape.getBBox !== 'function') {
		return undefined
	}
	const { x, y, width, height } = shape.getBBox()
	return width > 0 && height > 0 ? { x, y, width, height } : undefined
}

/**
 * A shape's box in diagram coordinates, or undefined when none can be found.
 *
 * Simple outlines state their box in attributes; the rest (mermaid draws a
 * cylinder or a stadium as a `path`) can only be measured once laid out.
 */
export function boundsOf(shape: Element): Bounds | undefined {
	const local =
		BOUNDS_BY_TAG[shape.tagName.toLowerCase()]?.(shape) ?? measuredBounds(shape)
	if (!local) return undefined
	const offset = absoluteOffset(shape)
	return { ...local, x: local.x + offset.x, y: local.y + offset.y }
}
