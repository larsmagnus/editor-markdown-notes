import { strokeStyle } from '#src/editor/extensions/mermaid/drawio/paint-style'

const ARROW_BY_MARKER: Record<string, string> = {
	point: 'classic',
	circle: 'oval',
	cross: 'cross',
}

/** Maps a mermaid marker reference to a draw.io arrow type. */
function arrowOf(path: Element, marker: 'marker-start' | 'marker-end') {
	const kind = /(point|circle|cross)(?:Start|End)/.exec(
		path.getAttribute(marker) ?? ''
	)?.[1]
	return (kind && ARROW_BY_MARKER[kind]) || 'none'
}

/** The draw.io style for an edge: its arrowheads and whether it is dashed. */
export function edgeStyle(path: Element) {
	const dashed = /edge-pattern-(?:dashed|dotted)/.test(
		path.getAttribute('class') ?? ''
	)
	return [
		'edgeStyle=none',
		'curved=1',
		strokeStyle(path),
		`startArrow=${arrowOf(path, 'marker-start')}`,
		`endArrow=${arrowOf(path, 'marker-end')}`,
		dashed ? 'dashed=1' : '',
	].join(';')
}
