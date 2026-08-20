import { viewOptionsSchema } from '@/lib/schemas'
import { EXTENSION_ID } from '@/shared/constants'
import { DEFAULT_VIEW_OPTIONS } from '@/shared/messages'
import type { ViewOptions } from '@/shared/messages'

export const VIEW_OPTIONS_STORAGE_KEY = `${EXTENSION_ID}:view-options`

/**
 * The view options the web app persists for itself. Inside VSCode the host owns
 * them instead, and this is never reached.
 */
export function readStoredViewOptions(): ViewOptions {
	try {
		const stored = localStorage.getItem(VIEW_OPTIONS_STORAGE_KEY)
		if (!stored) return DEFAULT_VIEW_OPTIONS

		return viewOptionsSchema.parse(JSON.parse(stored))
	} catch {
		// Only reachable if JSON.parse throws; the schema itself always resolves.
		return DEFAULT_VIEW_OPTIONS
	}
}

export function writeStoredViewOptions(viewOptions: ViewOptions) {
	localStorage.setItem(VIEW_OPTIONS_STORAGE_KEY, JSON.stringify(viewOptions))
}
