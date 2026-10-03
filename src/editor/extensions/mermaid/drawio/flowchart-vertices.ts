import type { Vertex } from '#src/editor/extensions/mermaid/drawio/cells'
import {
	fillStyle,
	strokeStyle,
} from '#src/editor/extensions/mermaid/drawio/paint-style'
import { boundsOf } from '#src/editor/extensions/mermaid/drawio/shape-bounds'
import { absoluteOffset } from '#src/editor/extensions/mermaid/drawio/svg-transform'
import { vertexStyle } from '#src/editor/extensions/mermaid/drawio/vertex-style'

const LABEL_PADDING = 20

/** Joins style fragments, leaving out the empty ones. */
function joinStyle(...parts: string[]) {
	return parts.filter(Boolean).join(';')
}

/** Removes the diagram ID prefix from an element ID. */
function withoutDiagramPrefix(id: string, diagramId: string) {
	const prefix = `${diagramId}-`
	return id.startsWith(prefix) ? id.slice(prefix.length) : id
}

/** Extracts label text from a mermaid element. */
function labelOf(element: Element) {
	const label = element.querySelector('.label, .cluster-label')
	return label?.textContent?.trim() ?? ''
}

/** A box around the label, for an outline that cannot be measured. */
function labelBox(node: Element) {
	const label = node.querySelector('foreignObject')
	const offset = absoluteOffset(node)
	const width = Number(label?.getAttribute('width') ?? 0) + LABEL_PADDING
	const height = Number(label?.getAttribute('height') ?? 0) + LABEL_PADDING
	return { x: offset.x - width / 2, y: offset.y - height / 2, width, height }
}

/** Creates a vertex from a mermaid node element. */
function nodeVertex(node: Element, name: string, type?: string): Vertex {
	const shape = node.querySelector('.label-container')
	const paint = shape ? [fillStyle(shape), strokeStyle(shape)] : []
	return {
		kind: 'vertex',
		id: `node-${name}`,
		label: labelOf(node),
		style: joinStyle(vertexStyle(type), ...paint),
		...((shape && boundsOf(shape)) || labelBox(node)),
	}
}

/** Creates a vertex from a mermaid cluster (subgraph) element, or undefined if unmeasurable. */
function clusterVertex(cluster: Element, name: string): Vertex | undefined {
	const outline = cluster.querySelector('rect') ?? cluster
	const bounds = boundsOf(outline)
	if (!bounds) return undefined
	return {
		kind: 'vertex',
		id: `cluster-${name}`,
		label: labelOf(cluster),
		style: joinStyle(
			'whiteSpace=wrap;verticalAlign=top',
			fillStyle(outline),
			strokeStyle(outline)
		),
		...bounds,
	}
}

/**
 * Every node and subgraph of a flowchart, keyed by the name it has in the
 * mermaid source. Subgraphs come first because cell order is z-order and they
 * have to sit behind their members.
 */
export function readVertices(
	root: Element,
	nodeTypes: ReadonlyMap<string, string>
) {
	const diagramId = root.getAttribute('id') ?? ''
	const vertices = new Map<string, Vertex>()

	for (const cluster of root.querySelectorAll('g.cluster')) {
		const name = withoutDiagramPrefix(cluster.id, diagramId)
		const vertex = clusterVertex(cluster, name)
		if (vertex) vertices.set(name, vertex)
	}

	for (const node of root.querySelectorAll('g.node')) {
		const match = /^flowchart-(.+)-\d+$/.exec(
			withoutDiagramPrefix(node.id, diagramId)
		)
		const name = match?.[1]
		if (name) vertices.set(name, nodeVertex(node, name, nodeTypes.get(name)))
	}

	return vertices
}
