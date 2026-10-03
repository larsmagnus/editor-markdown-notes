const DRAWIO_SVG_SUFFIX = '.drawio.svg'
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

/**
 * Whether `src` names a draw.io export the webview can read back.
 *
 * Decided on the author's path alone because an `<img>` never reveals what it
 * loaded. A scheme means remote: `img-src` lets those render, but `connect-src`
 * is the webview's own origin, so fetching one to convert it would be blocked.
 * The query and fragment are dropped so a cache-busting `?v=2` still counts.
 */
export function isLocalDrawioSvg(src: string) {
	if (HAS_SCHEME.test(src)) return false
	const [path = ''] = src.split(/[?#]/)
	return path.toLowerCase().endsWith(DRAWIO_SVG_SUFFIX)
}
