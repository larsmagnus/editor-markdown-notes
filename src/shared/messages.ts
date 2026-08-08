/**
 * Shared contract between the extension host (`src/extension.ts`) and the
 * webview React app. Types and plain constants only — no runtime imports —
 * so this file is safe to include in both build graphs.
 */

export type Theme = 'dark' | 'light' | 'system'

/**
 * The writing checks the text tools panel can run. Adding one here is the first
 * of three steps - `RULES` in `src/lib/text-tools/rules.ts` carries its label,
 * and `RULE_PLUGINS` in `src/lib/text-tools/run-pipeline.ts` the retext plugin
 * behind it. Both are keyed by this union, so neither compiles until updated.
 *
 * These ids are persisted in the host's `globalState`, so renaming one silently
 * drops that rule from a user's saved selection.
 */
export const TEXT_TOOL_RULE_IDS = [
	'passive',
	'simplify',
	'intensify',
	'readability',
] as const

export type TextToolRuleId = (typeof TEXT_TOOL_RULE_IDS)[number]

export type ViewOptions = {
	raw: boolean
	fullWidth: boolean
	theme: Theme
	/** Whether the text tools sidebar is open. */
	textTools: boolean
	/** Which checks that sidebar runs. */
	textToolRules: TextToolRuleId[]
}

export type ItalicMarker = '_' | '*'

export type ExtensionSettings = {
	centerContent: boolean
	hideToolbar: boolean
	/**
	 * Reading age the readability check scores against. A sentence too hard for
	 * this age reads as "hard"; one still too hard six years later, "very hard"
	 * (see `VERY_HARD_AGE_OFFSET` for why six).
	 */
	textToolsTargetAge: number
	/**
	 * Marker used when italicizing from the editor itself, not when parsing an
	 * existing file - italics already on disk keep whichever marker they were
	 * written with (see `Italic.extend` in `src/editor/extensions.ts`).
	 */
	italicMarker: ItalicMarker
}

export const DEFAULT_VIEW_OPTIONS: ViewOptions = {
	raw: false,
	fullWidth: false,
	theme: 'system',
	textTools: false,
	textToolRules: [...TEXT_TOOL_RULE_IDS],
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
	centerContent: false,
	hideToolbar: false,
	textToolsTargetAge: 16,
	italicMarker: '_',
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

/**
 * Where the webview resolves image paths that are not already absolute URLs.
 * Both are `vscode-resource` URIs - a webview page cannot load a plain file
 * path, and its own origin is nothing the author's relative path can target.
 */
export type ImageBaseUris = {
	/** The folder holding the open document, for `./x.png` and `x.png`. */
	document: string
	/** The workspace root, for `/x.png`. */
	workspace: string
}

export type LogLevel = 'error' | 'warn' | 'info'

export type WebviewToHost =
	| { type: 'save'; content: string }
	| { type: 'getContent' }
	| { type: 'setViewOptions'; viewOptions: ViewOptions }
	/**
	 * Diagnostics from inside the webview. Nothing in there reaches the extension
	 * host's console, so without this a script that fails to load or throws on
	 * mount just leaves a blank panel.
	 */
	| { type: 'log'; level: LogLevel; message: string }

export type HostToWebview =
	| { type: 'update'; content: string; fileName: string }
	| ({ type: 'config' } & Config)
