import type { Edge, Vertex } from '#src/editor/extensions/mermaid/drawio/cells'
import { endpointsOf } from '#src/editor/extensions/mermaid/drawio/edge-endpoints'
import { edgeStyle } from '#src/editor/extensions/mermaid/drawio/edge-style'
import { waypointsOf } from '#src/editor/extensions/mermaid/drawio/edge-waypoints'

/** Collects all edge labels from the diagram, keyed by data-id. */
function edgeLabels(root: Element) {
	const labels = new Map<string, string>()
	for (const label of root.querySelectorAll('.edgeLabel .label[data-id]')) {
		labels.set(
			label.getAttribute('data-id') ?? '',
			label.textContent?.trim() ?? ''
		)
	}
	return labels
}

/** Every edge of a flowchart, attached to the vertices it joins. */
export function readEdges(root: Element, vertices: Map<string, Vertex>) {
	const labels = edgeLabels(root)
	const names = new Set(vertices.keys())

	return Array.from(
		root.querySelectorAll('path[data-edge="true"]'),
		(path, index): Edge => {
			const dataId = path.getAttribute('data-id') ?? ''
			const [from, to] = endpointsOf(dataId, names) ?? []
			return {
				kind: 'edge',
				id: `edge-${index}`,
				label: labels.get(dataId) ?? '',
				style: edgeStyle(path),
				source: vertices.get(from ?? '')?.id,
				target: vertices.get(to ?? '')?.id,
				waypoints: waypointsOf(path),
			}
		}
	)
}
