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

export type ShikiThemeKind =
	| 'light'
	| 'dark'
	| 'high-contrast'
	| 'high-contrast-light'

/**
 * The user's active VS Code color theme, reshaped for Shiki. `raw` is
 * structurally a Shiki `ThemeRegistrationRaw` (itself close to a VS Code theme
 * JSON body) - typed loosely here since the host, which produces it, must stay
 * dependency-free and cannot import Shiki's types. `null` means extraction
 * failed (theme extension not found, file unreadable, malformed JSON); the
 * webview falls back to its own bundled theme for `kind` in that case.
 */
export type ShikiThemePayload = {
	themeId: string
	kind: ShikiThemeKind
	raw: Record<string, unknown> | null
}

export type WebviewToHost =
	| { type: 'save'; content: string }
	| { type: 'getContent' }
	| { type: 'setViewOptions'; viewOptions: ViewOptions }
	/**
	 * Asks the host to reopen this document with VSCode's built-in text editor.
	 * Deliberately not part of `ViewOptions` - the webview may be disposed the
	 * moment the host acts on it, so there is nothing to persist.
	 */
	| { type: 'openInTextEditor' }
	/**
	 * Diagnostics from inside the webview. Nothing in there reaches the extension
	 * host's console, so without this a script that fails to load or throws on
	 * mount just leaves a blank panel.
	 */
	| { type: 'log'; level: LogLevel; message: string }
	/** Requested once on mount rather than injected alongside `initialConfig`:
	 *  a resolved theme is tens of kilobytes of JSON, and inlining that into
	 *  every panel's HTML would cost every note, code blocks or not. */
	| { type: 'getShikiTheme' }

export type HostToWebview =
	| { type: 'update'; content: string; fileName: string }
	| ({ type: 'config' } & Config)
	/** Sent in reply to `getShikiTheme`, and again whenever the user switches
	 *  their active VS Code color theme. */
	| ({ type: 'shikiTheme' } & ShikiThemePayload)
