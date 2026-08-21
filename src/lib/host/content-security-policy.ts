/**
 * The policy the webview document runs under.
 *
 * Two directives are load-bearing beyond the obvious. `script-src` allows
 * `cspSource` because the nonce on the entry script is not inherited by the
 * modules it imports - that covers both the build's vendor chunks and the
 * mermaid bundles, which are fetched on demand. `style-src` allows inline
 * styles because a rendered mermaid diagram carries its own `<style>` element
 * inside the SVG; without it the diagram loads but draws unstyled.
 */
export function buildContentSecurityPolicy(
	cspSource: string,
	nonce: string
): string {
	return [
		`default-src 'none'`,
		`img-src ${cspSource} https: data:`,
		`script-src 'nonce-${nonce}' ${cspSource}`,
		`style-src ${cspSource} 'unsafe-inline'`,
		`font-src ${cspSource} data:`,
		`connect-src ${cspSource}`,
		// The text tools analyser runs in a worker. It cannot be loaded from
		// `cspSource`: that host is a different origin from the webview document,
		// and a worker must be same-origin. Vite inlines the worker and boots it
		// from a blob URL, which inherits this document's origin - hence `blob:`
		// rather than `${cspSource}`.
		`worker-src blob:`,
	].join('; ')
}
