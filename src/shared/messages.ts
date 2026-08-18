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

/**
 * Matches `maxLength` on both `claudePromptTemplate` settings in
 * `package.json` - JSON has no way to reference this constant, so keep the
 * two in sync by hand.
 */
export const CLAUDE_PROMPT_TEMPLATE_MAX_LENGTH = 500

/**
 * How much of a `%c` excerpt reaches the prompt. It is there to point Claude
 * at one part of a file it is also being told to read, so a locator's worth is
 * enough - and the whole prompt is typed into a terminal a character at a time.
 */
export const CLAUDE_PROMPT_CONTENT_MAX_LENGTH = 300

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
	/**
	 * Prompt sent to `claude` by the toolbar's "Open in Claude" action.
	 * Tokens: `%@` the note as an at-reference, `%s` its bare path relative to
	 * the workspace root, `%c` the excerpt being asked about (nothing here).
	 */
	claudePromptTemplate: string
	/**
	 * Prompt sent to `claude` by "Open in Claude" on one part of the note - a
	 * diagram, so far. Same tokens as `claudePromptTemplate`, but `%c` carries
	 * that part's source, which is what narrows Claude to it.
	 */
	claudeInlinePromptTemplate: string
	/**
	 * Where the slash command's "image" action copies a file picked from
	 * outside the open document's workspace folder, relative to the
	 * document's own folder. A file already inside the workspace is
	 * referenced in place instead of being copied.
	 */
	imageCopyDirectory: string
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
	claudePromptTemplate: 'Read %@ so I can ask you questions about it.',
	claudeInlinePromptTemplate:
		'Read %@, then focus on the part of it that starts with "%c" so I can ask you questions about that.',
	imageCopyDirectory: 'assets',
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

/**
 * Where to scroll a note opened from a search result, and what to highlight.
 *
 * Injected as `window.searchReveal` rather than posted, so the first paint
 * already knows where to go. Absent on an ordinary open, which is most of them.
 *
 * Positions are in *body* coordinates: search reports source lines, the editor
 * is given the markdown with its frontmatter stripped, and the host subtracts
 * `splitFrontmatter`'s `lineOffset` before any of this leaves it. The webview
 * never sees a source line and so cannot get that subtraction wrong.
 */
export type SearchReveal = {
	/** 0-based, relative to the body the editor holds. */
	line: number
	/** 0-based. */
	column: number
	/**
	 * The matched source text, which is what the live editor looks for in the
	 * rendered document - no markdown source map exists, so finding the text
	 * again is what places the match, and every other place it occurs.
	 *
	 * Its extent is an upper bound rather than a measurement (see
	 * `deriveQueryLength`), so it can carry a few characters of the surrounding
	 * line. That makes it fail to match rather than match the wrong place, which
	 * is the safe direction.
	 */
	text: string
	/**
	 * Source lines the frontmatter occupies, already subtracted from `line`. Raw
	 * mode adds it back, since the textarea holds the whole file including the
	 * frontmatter.
	 */
	lineOffset: number
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
	 * Where this note is scrolled to, so reopening it lands in the same place.
	 *
	 * Not part of `ViewOptions`: those are one shared set of toggles broadcast to
	 * every panel, while this is per-document and belongs to this one. The host
	 * keeps it in memory only (`ScrollPositionStore`), so it lasts the session.
	 */
	| { type: 'setScrollTop'; scrollTop: number }
	/**
	 * Asks the host to reopen this document with VSCode's built-in text editor.
	 * Deliberately not part of `ViewOptions` - the webview may be disposed the
	 * moment the host acts on it, so there is nothing to persist.
	 */
	| { type: 'openInTextEditor' }
	/**
	 * Asks the host to open an integrated terminal running `claude`, prompted
	 * to read this document by path (see `claudePromptTemplate`). The path is
	 * never sent - the host resolves it from the same `vscode.TextDocument`
	 * `openInTextEditor` uses.
	 *
	 * `content` is an excerpt to point Claude at within that document (a
	 * diagram's source, so far). Sending it switches the host to
	 * `claudeInlinePromptTemplate`; only the excerpt travels, never the note.
	 */
	| { type: 'openClaudeTerminal'; content?: string }
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
	/** Asks the host to show its native file-open dialog for an image, for the
	 *  slash command's "image" action. Answered once, by `imagePicked`. */
	| { type: 'pickImage' }
	/**
	 * Asks the host to run `prompt` through the Claude Agent SDK, pointed at
	 * this document by path the same way `openClaudeTerminal` is - the path is
	 * never sent, the host resolves it from its own `vscode.TextDocument`.
	 * `selectedText` is the excerpt being asked about (bubble menu only; the
	 * `/ask` slash command has none). `requestId` is webview-generated so
	 * replies for more than one in-flight ask can be told apart.
	 */
	| {
			type: 'askClaude'
			requestId: string
			prompt: string
			selectedText?: string
	  }
	/** Stops a running `askClaude` request; no reply is sent for it. */
	| { type: 'cancelAsk'; requestId: string }

export type HostToWebview =
	| { type: 'update'; content: string; fileName: string }
	| ({ type: 'config' } & Config)
	/** Sent in reply to `getShikiTheme`, and again whenever the user switches
	 *  their active VS Code color theme. */
	| ({ type: 'shikiTheme' } & ShikiThemePayload)
	/** Sent in reply to `pickImage`. `path` is relative to the document's own
	 *  folder (the same base `resolveImageSrc` resolves a relative `src`
	 *  against), or `null` if the dialog was cancelled. */
	| { type: 'imagePicked'; path: string | null }
	/** Streamed reply to `askClaude`: one chunk of the response's text delta. */
	| { type: 'askChunk'; requestId: string; text: string }
	/** Sent once an `askClaude` request finishes successfully. */
	| { type: 'askDone'; requestId: string }
	/** Sent once an `askClaude` request fails - a bad/missing `claude` CLI,
	 *  an auth failure, or the request being aborted. */
	| { type: 'askError'; requestId: string; error: string }
