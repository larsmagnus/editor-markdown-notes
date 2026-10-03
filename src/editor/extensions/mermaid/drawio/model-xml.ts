import { cellToXml } from '#src/editor/extensions/mermaid/drawio/cell-xml'
import type { DrawioCell } from '#src/editor/extensions/mermaid/drawio/cells'
import { element } from '#src/editor/extensions/mermaid/drawio/xml-attributes'

const ROOT_LAYER = element('mxCell', { id: '0' })
const DEFAULT_LAYER = element('mxCell', { id: '1', parent: '0' })

/**
 * Serializes cells into the XML draw.io imports when it is pasted as text.
 *
 * Cell order is draw.io's z-order, so callers list containers before their
 * members.
 */
export function modelXml(cells: DrawioCell[]) {
	const body = cells.map(cellToXml).join('')
	return element(
		'mxGraphModel',
		{},
		element('root', {}, ROOT_LAYER + DEFAULT_LAYER + body)
	)
}
