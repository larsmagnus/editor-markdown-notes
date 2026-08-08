import { configSchema } from '@/lib/schemas'
import { readStoredViewOptions } from '@/lib/view-options-storage'
import { isVSCodeWebview } from '@/lib/vscode-api'
import { DEFAULT_SETTINGS } from '@/shared/messages'
import type { Config } from '@/shared/messages'

/**
 * The settings the app starts with, from whichever side owns them.
 *
 * In VSCode the host injects `window.initialConfig` ahead of the bundle, so the
 * very first render already has the right theme and width; standalone, only the
 * view options persist and the rest are the manifest defaults.
 */
export function readInitialSettings(): Config {
	if (!isVSCodeWebview()) {
		return {
			viewOptions: readStoredViewOptions(),
			settings: DEFAULT_SETTINGS,
		}
	}

	return configSchema.parse(window.initialConfig)
}
