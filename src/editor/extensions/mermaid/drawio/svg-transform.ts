import type { Point } from '#src/editor/extensions/mermaid/drawio/cells'

const ORIGIN: Point = { x: 0, y: 0 }
const NUMBER = String.raw`-?\d+(?:\.\d+)?(?:e[+-]?\d+)?`
const TRANSLATE = new RegExp(
	`translate\\(\\s*(${NUMBER})[\\s,]+(${NUMBER})\\s*\\)`
)

/** An element's own `translate()`, the only transform mermaid positions by. */
function translationOf(element: Element): Point {
	const match = TRANSLATE.exec(element.getAttribute('transform') ?? '')
	if (!match) return ORIGIN
	return { x: Number(match[1]), y: Number(match[2]) }
}

/**
 * Where an element's origin sits in the diagram: its own translation plus that
 * of every group around it, since a subgraph nests a `g.root` of its own.
 */
export function absoluteOffset(element: Element | null): Point {
	if (!element) return ORIGIN
	const own = translationOf(element)
	const outer = absoluteOffset(element.parentElement)
	return { x: own.x + outer.x, y: own.y + outer.y }
}
