import {
	cleanLabel,
	linkOperator,
	parseStyle,
	wrapNodeLabel,
} from '#src/editor/extensions/image/drawio/mermaid-syntax'
import { readCell } from '#src/editor/extensions/image/drawio/read-cell'

type Node = {
	element: Element
	label: string
	mermaidId: string
	children: Node[]
}

function geometryOf(element: Element, axis: 'x' | 'y') {
	return Number(element.querySelector('mxGeometry')?.getAttribute(axis) ?? 0)
}

/** Reads the way the diagram grows, so a wide one is not stacked into a tall one. */
function directionOf(topLevel: Element[]) {
	const spread = (axis: 'x' | 'y') => {
		const positions = topLevel.map((element) => geometryOf(element, axis))
		return Math.max(...positions) - Math.min(...positions)
	}
	return spread('x') > spread('y') ? 'LR' : 'TD'
}

function nodeLine(node: Node, indent: string) {
	const style = parseStyle(node.element.getAttribute('style'))
	const label = cleanLabel(node.label, style)
	return node.children.length > 0
		? `${indent}subgraph ${node.mermaidId}["${label}"]`
		: `${indent}${node.mermaidId}${wrapNodeLabel(style, label)}`
}

function renderNode(node: Node, depth: number): string[] {
	const indent = '  '.repeat(depth)
	if (node.children.length === 0) return [nodeLine(node, indent)]
	return [
		nodeLine(node, indent),
		...node.children.flatMap((child) => renderNode(child, depth + 1)),
		`${indent}end`,
	]
}

/**
 * A draw.io page as a mermaid flowchart, or `null` when it holds no nodes.
 *
 * Lossy by design: mermaid lays the graph out itself, so positions, colours
 * and waypoints are dropped and only structure survives - nodes and their
 * shapes, labelled edges, and containers as subgraphs.
 */
export function drawioToMermaid(xml: string) {
	const doc = new DOMParser().parseFromString(xml, 'text/xml')
	if (doc.querySelector('parsererror')) return null

	const vertices = Array.from(doc.querySelectorAll('mxCell[vertex="1"]'))
	if (vertices.length === 0) return null

	const nodes = new Map(
		vertices.map((element, index): [string | null, Node] => {
			const { id, label } = readCell(element)
			return [id, { element, label, mermaidId: `n${index + 1}`, children: [] }]
		})
	)
	const roots: Node[] = []
	for (const node of nodes.values()) {
		const parent = nodes.get(node.element.getAttribute('parent'))
		;(parent?.children ?? roots).push(node)
	}

	const edges = Array.from(doc.querySelectorAll('mxCell[edge="1"]')).flatMap(
		(edge) => {
			const source = nodes.get(edge.getAttribute('source'))
			const target = nodes.get(edge.getAttribute('target'))
			if (!source || !target) return []
			const style = parseStyle(edge.getAttribute('style'))
			const label = cleanLabel(readCell(edge).label, style)
			const link = `${linkOperator(style)}${label ? `|"${label}"|` : ''}`
			return [`  ${source.mermaidId} ${link} ${target.mermaidId}`]
		}
	)

	return [
		`flowchart ${directionOf(roots.map((node) => node.element))}`,
		...roots.flatMap((node) => renderNode(node, 1)),
		...edges,
	].join('\n')
}
