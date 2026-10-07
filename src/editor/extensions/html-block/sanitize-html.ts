import DOMPurify from 'dompurify'

import { resolveImageSrc } from '#src/lib/host/resolve-image-src'

/**
 * `source` as HTML safe to draw in the editor: no scripts, styles, frames,
 * forms or event handlers, and every image pointed at the same place the
 * note's own images resolve to. The webview's content security policy is the
 * second line behind this, not the first.
 */
export function sanitizeHtml(source: string): string {
	const html = DOMPurify.sanitize(source, {
		FORBID_TAGS: [
			'style',
			'iframe',
			'object',
			'embed',
			'form',
			'input',
			'button',
		],
		FORBID_ATTR: ['style'],
	})
	const template = document.createElement('template')
	template.innerHTML = html
	template.content.querySelectorAll('img[src]').forEach((image) => {
		image.setAttribute(
			'src',
			resolveImageSrc(image.getAttribute('src') ?? '', window.imageBaseUris)
		)
	})
	return template.innerHTML
}
