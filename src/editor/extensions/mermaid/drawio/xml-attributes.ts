/** Two decimals is finer than draw.io's own grid and keeps the paste small. */
export function round(value: number) {
	return String(Math.round(value * 100) / 100)
}

/** Newlines are encoded because a raw one inside an attribute reads as a space. */
function escapeAttribute(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll('\n', '&#10;')
}

/** An XML element; attributes left undefined are omitted. */
export function element(
	name: string,
	entries: Record<string, string | undefined>,
	children = ''
) {
	const attributes = Object.entries(entries)
		.flatMap(([key, value]) =>
			value === undefined ? [] : [` ${key}="${escapeAttribute(value)}"`]
		)
		.join('')
	return children
		? `<${name}${attributes}>${children}</${name}>`
		: `<${name}${attributes}/>`
}
