const WRAPPER_TAGS = new Set(['object', 'UserObject'])

/**
 * A cell's id and label.
 *
 * draw.io moves both onto an `<object>`/`<UserObject>` wrapper once a shape
 * carries a link, tooltip or custom property, leaving the inner `mxCell` with
 * neither - so reading the cell alone drops those nodes and every edge to them.
 * Style, geometry and the `parent`/`source`/`target` references stay on the cell.
 */
export function readCell(cell: Element) {
	const wrapper = WRAPPER_TAGS.has(cell.parentElement?.tagName ?? '')
		? cell.parentElement
		: null
	return {
		id: (wrapper ?? cell).getAttribute('id'),
		label: wrapper?.getAttribute('label') ?? cell.getAttribute('value') ?? '',
	}
}
