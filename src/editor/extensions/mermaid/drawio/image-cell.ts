import type { Vertex } from '#src/editor/extensions/mermaid/drawio/cells'

const FALLBACK_SIZE = 100

/** Encodes text as UTF-8 base64 for data URIs. */
function toBase64(text: string) {
	const bytes = new TextEncoder().encode(text)
	return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
}

/** Extracts dimensions from SVG viewBox, or returns default fallback size. */
function sizeOf(svg: Element) {
	const [, , width, height] = (svg.getAttribute('viewBox') ?? '')
		.trim()
		.split(/[\s,]+/)
		.map(Number)
	if (width && height) return { width, height }
	return { width: FALLBACK_SIZE, height: FALLBACK_SIZE }
}

/**
 * The whole diagram as one picture, for anything that has no native mapping.
 *
 * draw.io style strings are `;`-separated, so its data URIs drop the
 * `;base64` marker; the payload is still base64.
 */
export function imageCell(svg: string, root: Element): Vertex {
	return {
		kind: 'vertex',
		id: 'diagram-image',
		label: '',
		style: `shape=image;verticalLabelPosition=bottom;verticalAlign=top;imageAspect=0;aspect=fixed;image=data:image/svg+xml,${toBase64(svg)}`,
		x: 0,
		y: 0,
		...sizeOf(root),
	}
}
