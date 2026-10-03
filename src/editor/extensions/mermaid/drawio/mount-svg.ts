/**
 * Runs `read` on the diagram attached to the page, and detaches it again.
 *
 * Colours come from a stylesheet and path-drawn shapes have no box in their
 * attributes, so both exist only once the browser has laid the diagram out.
 */
export function withMountedSvg<T>(
	parsed: Document,
	read: (root: Element) => T
) {
	const host = document.createElement('div')
	host.style.cssText =
		'position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none'
	const root = document.adoptNode(parsed.documentElement)
	host.append(root)
	document.body.append(host)
	try {
		return read(root)
	} finally {
		host.remove()
	}
}
