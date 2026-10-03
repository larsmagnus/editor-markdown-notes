/** Inflates the base64 + raw-deflate + URI-encoded form draw.io stores a compressed page in. */
async function inflatePage(payload: string) {
	const bytes = Uint8Array.from(atob(payload.trim()), (char) =>
		char.charCodeAt(0)
	)
	const inflated = new Blob([bytes])
		.stream()
		.pipeThrough(new DecompressionStream('deflate-raw'))
	return decodeURIComponent(await new Response(inflated).text())
}

/**
 * The first page's `mxGraphModel` XML out of a `.drawio.svg`, or `null` when
 * the text is not one or its page cannot be read.
 *
 * draw.io keeps the whole file entity-escaped in the root `content` attribute
 * and compresses each page unless told not to, so both forms are handled.
 */
export async function readDrawioXml(svgText: string) {
	try {
		const svg = new DOMParser().parseFromString(svgText, 'image/svg+xml')
		const content = svg.documentElement.getAttribute('content')
		if (!content) return null

		const file = new DOMParser().parseFromString(content, 'text/xml')
		const diagram = file.querySelector('diagram')
		if (!diagram) return null

		const model = diagram.querySelector('mxGraphModel')
		if (model) return new XMLSerializer().serializeToString(model)

		return await inflatePage(diagram.textContent)
	} catch {
		return null
	}
}
