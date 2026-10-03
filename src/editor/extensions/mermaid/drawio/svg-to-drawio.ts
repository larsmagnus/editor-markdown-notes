import type { DrawioCell } from '#src/editor/extensions/mermaid/drawio/cells'
import { readEdges } from '#src/editor/extensions/mermaid/drawio/flowchart-edges'
import { readVertices } from '#src/editor/extensions/mermaid/drawio/flowchart-vertices'
import { imageCell } from '#src/editor/extensions/mermaid/drawio/image-cell'
import { modelXml } from '#src/editor/extensions/mermaid/drawio/model-xml'
import { withMountedSvg } from '#src/editor/extensions/mermaid/drawio/mount-svg'

/** Checks if the rendered diagram is a flowchart. */
function isFlowchart(root: Element) {
	return root.getAttribute('aria-roledescription')?.startsWith('flowchart')
}

/** Converts flowchart vertices and edges to draw.io cells, or empty array if not a flowchart. */
function nativeCells(
	root: Element,
	nodeTypes: ReadonlyMap<string, string>
): DrawioCell[] {
	if (!isFlowchart(root)) return []
	const vertices = readVertices(root, nodeTypes)
	if (vertices.size === 0) return []
	return [...vertices.values(), ...readEdges(root, vertices)]
}

/** A reader bug must cost the editable shapes, never the copy itself. */
function tryNativeCells(root: Element, nodeTypes: ReadonlyMap<string, string>) {
	try {
		return nativeCells(root, nodeTypes)
	} catch (error) {
		console.error('Could not convert the diagram to draw.io shapes:', error)
		return []
	}
}

/**
 * Converts a mermaid-rendered SVG into draw.io XML ready to paste as text.
 *
 * Only flowcharts become editable shapes; every other diagram type is embedded
 * as an image, since mermaid's markup differs per type and each would need a
 * reader of its own. Relies on mermaid 11's class names and ids.
 */
export function svgToDrawio(
	svg: string,
	nodeTypes: ReadonlyMap<string, string> = new Map()
) {
	const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml')
	return withMountedSvg(parsed, (root) => {
		const cells = tryNativeCells(root, nodeTypes)
		return modelXml(cells.length > 0 ? cells : [imageCell(svg, root)])
	})
}
