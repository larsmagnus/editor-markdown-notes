import { Plugin, PluginKey } from '@tiptap/pm/state'

import { scrollToHeadingInEditor } from '#src/editor/extensions/link/scroll-to-heading'
import { openLink } from '#src/lib/link/open-link'
import { resolveLinkHref } from '#src/lib/link/resolve-link-href'

/**
 * Replaces `@tiptap/extension-link`'s stock `openOnClick` plugin (turned off
 * in `link-extension.ts`, since its `clickHandler` has no hook to bail only
 * for a relative href), keeping its `window.open` behavior for an absolute
 * URL but routing a relative href through the host instead, and a
 * same-document `#hash` straight to `scroll-to-heading.ts` with no host
 * round trip.
 *
 * `handleDOMEvents.click` rather than the position-computing `handleClick`
 * prop: a real click on an `<a>` is exactly what's needed here, with no
 * reason to make it depend on `posAtCoords` succeeding.
 */
export function createLinkClickHandler(): Plugin {
	return new Plugin({
		key: new PluginKey('linkClickHandler'),
		props: {
			handleDOMEvents: {
				click: (view, event) => {
					if (event.button !== 0 || !view.editable) return false

					const target = event.target
					const link =
						target instanceof HTMLAnchorElement
							? target
							: target instanceof Element
								? target.closest('a')
								: null
					if (!link || !view.dom.contains(link)) return false

					const href = link.getAttribute('href')
					if (!href) return false

					// The browser's own anchor navigation would otherwise still fire
					// alongside whichever of the three branches below actually handles
					// it - `window.open` for an absolute URL included, since that opens
					// a second, unwanted top-level navigation on top of it.
					event.preventDefault()

					const resolved = resolveLinkHref(href)
					if (resolved.kind === 'external') {
						window.open(href, link.target || undefined, 'noopener,noreferrer')
					} else if (resolved.kind === 'same-document-hash') {
						scrollToHeadingInEditor(view, resolved.hash)
					} else {
						openLink(resolved.href)
					}

					return true
				},
			},
		},
	})
}
