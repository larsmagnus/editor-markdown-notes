import type { Config, ImageBaseUris, WebviewToHost } from '@/shared/messages'

interface VSCodeAPI {
	postMessage: (message: WebviewToHost) => void
	getState: () => unknown
	setState: (state: unknown) => void
}

declare global {
	interface Window {
		vscode?: VSCodeAPI
		initialContent?: string
		fileName?: string
		initialConfig?: Config
		imageBaseUris?: ImageBaseUris
	}
}

/** The bridge the extension host injects, or `undefined` in the web app. */
export function getVSCodeApi(): VSCodeAPI | undefined {
	return window.vscode
}

/**
 * Whether the app is running inside the extension's webview.
 *
 * Synchronous by design, and the single source of this answer. The host injects
 * `window.vscode` before the bundle runs, so deriving it in an effect instead
 * reports `false` on the first render - long enough for a save to take the
 * standalone path and be dropped.
 */
export function isVSCodeWebview(): boolean {
	return Boolean(window.vscode)
}
