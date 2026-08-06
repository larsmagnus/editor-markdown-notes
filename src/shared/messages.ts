/**
 * Shared contract between the extension host (`src/extension.ts`) and the
 * webview React app. Types and plain constants only — no runtime imports —
 * so this file is safe to include in both build graphs.
 */

export type Theme = 'dark' | 'light' | 'system'

export type ViewOptions = {
	raw: boolean
	fullWidth: boolean
	theme: Theme
}

export type ExtensionSettings = {
	centerContent: boolean
	hideNav: boolean
}

export const DEFAULT_VIEW_OPTIONS: ViewOptions = {
	raw: false,
	fullWidth: false,
	theme: 'system',
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
	centerContent: false,
	hideNav: false,
}

/**
 * What the host knows. The host fills in `DEFAULT_VIEW_OPTIONS` for anything
 * missing from `globalState`, but the webview still validates the payload
 * (`src/lib/schemas.ts`) since it may come from an older host.
 */
export type Config = {
	settings: ExtensionSettings
	viewOptions: ViewOptions
}

export type WebviewToHost =
	| { type: 'save'; content: string }
	| { type: 'getContent' }
	| { type: 'setViewOptions'; viewOptions: ViewOptions }

export type HostToWebview =
	| { type: 'update'; content: string; fileName: string }
	| ({ type: 'config' } & Config)
