type CellSpec = {
	id: string
	value?: string
	style?: string
	parent?: string
	source?: string
	target?: string
	x?: number
	y?: number
}

/** One `<mxCell>`; edges are the cells that name a source or target. */
function cellXml({
	id,
	value = '',
	style = '',
	parent = '1',
	source,
	target,
	x = 0,
	y = 0,
}: CellSpec) {
	const isEdge = source !== undefined || target !== undefined
	const kind = isEdge ? 'edge="1"' : 'vertex="1"'
	const ends = [
		source ? `source="${source}"` : '',
		target ? `target="${target}"` : '',
	].join(' ')
	return `<mxCell id="${id}" value="${value}" style="${style}" ${kind} parent="${parent}" ${ends}><mxGeometry x="${x}" y="${y}" width="80" height="40" as="geometry"/></mxCell>`
}

/** An uncompressed draw.io file holding `cells` on the default layer. */
export function drawioFile(cells: CellSpec[]) {
	return `<mxfile><diagram id="d" name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells
		.map(cellXml)
		.join('')}</root></mxGraphModel></diagram></mxfile>`
}

/** The way draw.io embeds a file in a `.drawio.svg`: entity-escaped in `content`. */
export function drawioSvg(xml: string) {
	const content = xml
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
	return `<svg xmlns="http://www.w3.org/2000/svg" content="${content}"><g/></svg>`
}
