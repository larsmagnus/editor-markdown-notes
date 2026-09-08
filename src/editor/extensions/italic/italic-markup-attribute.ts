import type { Storage } from '@tiptap/core'

import { DEFAULT_SETTINGS } from '#src/shared/messages'

/**
 * The `markup` attribute's config, factored out of `italic-extension.ts` so
 * that file's own `fta` complexity score stays under the repo's cap - see
 * `italic-extension.ts` for why `getLiveStorage` reads through a live
 * reference rather than a snapshot.
 */
export function italicMarkupAttribute(
	getLiveStorage: () => Storage['italic'] | null
) {
	return {
		default: DEFAULT_SETTINGS.italicMarker,
		parseHTML: (element: HTMLElement) =>
			element.getAttribute('data-markup') ||
			getLiveStorage()?.preferredMarkup ||
			DEFAULT_SETTINGS.italicMarker,
		renderHTML: () => ({}),
		rendered: false,
	}
}
