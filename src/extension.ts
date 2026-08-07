import * as path from 'path'

import * as vscode from 'vscode'

// Resolves to `out/shared/messages.js`, which loads as CommonJS thanks to the
// `out/package.json` sentinel written by `pnpm vscode:sentinel`.
import { DEFAULT_SETTINGS, DEFAULT_VIEW_OPTIONS } from './shared/messages'
import type {
	Config,
	ExtensionSettings,
	HostToWebview,
	ImageBaseUris,
	Theme,
	ViewOptions,
	WebviewToHost,
} from './shared/messages'

const VIEW_TYPE = 'editor-markdown-notes.markdownEditor'
const CONFIG_SECTION = 'editorMarkdownNotes'
const VIEW_OPTIONS_KEY = 'editorMarkdownNotes.viewOptions'

const THEME_CHOICES: { label: string; value: Theme }[] = [
	{ label: 'Light', value: 'light' },
	{ label: 'Dark', value: 'dark' },
	{ label: 'System', value: 'system' },
]

class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
	private readonly context: vscode.ExtensionContext
	private readonly panels = new Set<vscode.WebviewPanel>()
	private updateInProgress = false

	constructor(context: vscode.ExtensionContext) {
		this.context = context
	}

	public register(): vscode.Disposable {
		return vscode.Disposable.from(
			vscode.window.registerCustomEditorProvider(VIEW_TYPE, this),
			vscode.workspace.onDidChangeConfiguration((e) => {
				if (e.affectsConfiguration(CONFIG_SECTION)) this.broadcastConfig()
			})
		)
	}

	public getViewOptions(): ViewOptions {
		return {
			...DEFAULT_VIEW_OPTIONS,
			...this.context.globalState.get<Partial<ViewOptions>>(VIEW_OPTIONS_KEY),
		}
	}

	/** Persists a change and pushes it to every open editor tab. */
	public async updateViewOptions(patch: Partial<ViewOptions>) {
		await this.context.globalState.update(VIEW_OPTIONS_KEY, {
			...this.getViewOptions(),
			...patch,
		})

		this.broadcastConfig()
	}

	/** Manifest defaults apply automatically; `DEFAULT_SETTINGS` only backstops
	 * a key missing from `contributes.configuration` entirely. */
	private getSettings(): ExtensionSettings {
		const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

		return {
			centerContent: config.get<boolean>(
				'centerContent',
				DEFAULT_SETTINGS.centerContent
			),
			hideNav: config.get<boolean>('hideNav', DEFAULT_SETTINGS.hideNav),
		}
	}

	private getConfig(): Config {
		return {
			settings: this.getSettings(),
			viewOptions: this.getViewOptions(),
		}
	}

	/** Keeps every open editor tab in sync with the shared state. */
	private broadcastConfig() {
		const message: HostToWebview = { type: 'config', ...this.getConfig() }

		for (const panel of this.panels) {
			panel.webview.postMessage(message)
		}
	}

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Set up the webview options
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.file(path.join(this.context.extensionPath, 'dist')),
				vscode.Uri.file(path.join(this.context.extensionPath, 'out')),
				...getDocumentResourceRoots(document),
			],
		}

		webviewPanel.webview.html = this.getHtmlForWebview(
			webviewPanel.webview,
			document
		)

		this.panels.add(webviewPanel)

		// Update the webview when the document changes (but not during our own saves)
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
			(e) => {
				if (
					e.document.uri.toString() === document.uri.toString() &&
					!this.updateInProgress
				) {
					this.updateWebview(webviewPanel, document)
				}
			}
		)

		// Handle messages from the webview
		webviewPanel.webview.onDidReceiveMessage(async (message: WebviewToHost) => {
			switch (message.type) {
				case 'save':
					await this.saveDocument(document, message.content)
					break
				case 'getContent':
					this.updateWebview(webviewPanel, document)
					// The webview also gets its config injected into the page, but
					// resend it here in case the panel was restored from a cold start.
					this.broadcastConfig()
					break
				case 'setViewOptions':
					await this.updateViewOptions(message.viewOptions)
					break
			}
		})

		// Clean up subscriptions when the panel is disposed
		webviewPanel.onDidDispose(() => {
			this.panels.delete(webviewPanel)
			changeDocumentSubscription.dispose()
		})
	}

	private getHtmlForWebview(
		webview: vscode.Webview,
		document: vscode.TextDocument
	): string {
		const distPath = path.join(this.context.extensionPath, 'dist')
		const entry = readEntryChunk(distPath)

		// Without the manifest there is nothing to load, and an empty panel gives
		// no hint as to why. `pnpm build` is what produces it.
		if (!entry) {
			return `<!DOCTYPE html>
    <html lang="en">
    <body>
        <h1>Editor Markdown Notes could not start</h1>
        <p>The built webview assets are missing. Run <code>pnpm build</code> and reopen the file.</p>
    </body>
    </html>`
		}

		const toUri = (file: string) =>
			webview.asWebviewUri(vscode.Uri.file(path.join(distPath, file)))

		const jsUri = toUri(entry.file)
		const cssUris = entry.css.map(toUri)
		// Fetched up front rather than when the entry chunk gets around to
		// importing them.
		const preloadUris = entry.imports.map(toUri)

		// Generate nonce for CSP
		const nonce = getNonce()

		const imageBaseUris = getImageBaseUris(webview, document)

		return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- The nonce covers the inline bootstrap script below. It is not
             inherited by imported modules, so the code-split chunks need
             \`cspSource\` to be allowed as well. -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}' ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource} data:; connect-src ${webview.cspSource};">
        <title>Editor Markdown Notes</title>
        ${cssUris.map((uri) => `<link rel="stylesheet" crossorigin href="${uri}">`).join('\n        ')}
        ${preloadUris.map((uri) => `<link rel="modulepreload" crossorigin href="${uri}" nonce="${nonce}">`).join('\n        ')}
        <style>
            body, html {
                margin: 0;
                padding: 0;
                height: 100vh;
            }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script nonce="${nonce}">
            window.vscode = acquireVsCodeApi();
            window.initialContent = ${toScriptLiteral(document.getText())};
            window.fileName = ${toScriptLiteral(path.basename(document.fileName))};
            window.initialConfig = ${toScriptLiteral(this.getConfig())};
            window.imageBaseUris = ${toScriptLiteral(imageBaseUris)};
        </script>
        <script type="module" crossorigin src="${jsUri}" nonce="${nonce}"></script>
    </body>
    </html>`
	}

	private updateWebview(
		panel: vscode.WebviewPanel,
		document: vscode.TextDocument
	) {
		const message: HostToWebview = {
			type: 'update',
			content: document.getText(),
			fileName: path.basename(document.fileName),
		}

		panel.webview.postMessage(message)
	}

	private async saveDocument(document: vscode.TextDocument, content: string) {
		// Prevent update loop
		this.updateInProgress = true

		try {
			const edit = new vscode.WorkspaceEdit()

			// Replace the entire document content
			edit.replace(
				document.uri,
				new vscode.Range(0, 0, document.lineCount, 0),
				content
			)

			await vscode.workspace.applyEdit(edit)

			// Save the document to persist changes
			await document.save()
		} finally {
			// Reset flag after a brief delay to ensure all events have processed
			setTimeout(() => {
				this.updateInProgress = false
			}, 100)
		}
	}
}

type EntryChunk = {
	/** Entry chunk path, relative to `dist/`. */
	file: string
	/** Stylesheets from the entry and everything it imports. */
	css: string[]
	/** Chunks reachable from the entry by static import, relative to `dist/`. */
	imports: string[]
}

/** The subset of a Vite manifest entry the host reads. */
type ManifestChunk = {
	file?: string
	css?: string[]
	imports?: string[]
}

/**
 * Locates the built entry chunk through Vite's manifest. The file names carry
 * content hashes and the code-split chunks are named after their modules, so
 * there is nothing stable to match on by hand.
 *
 * Hand-rolled rather than validated with zod: the `.vsix` is packaged with
 * `--no-dependencies`, so the host cannot require anything at runtime.
 */
function readEntryChunk(distPath: string): EntryChunk | undefined {
	let manifest: Record<string, ManifestChunk>

	try {
		const fs = require('fs')
		manifest = JSON.parse(
			fs.readFileSync(path.join(distPath, 'manifest.json'), 'utf8')
		)
	} catch (error) {
		console.error('Failed to read the Vite manifest:', error)
		return undefined
	}

	const entry = manifest['index.html']
	if (!entry?.file) {
		console.error('The Vite manifest has no index.html entry')
		return undefined
	}

	// A chunk's stylesheets hang off that chunk, so collecting only the entry's
	// would leave anything a vendor chunk brings with it unstyled. The graph is
	// walked in full because an imported chunk may import further chunks.
	const imports: string[] = []
	const css = [...(entry.css ?? [])]
	const seen = new Set<string>()

	const collect = (keys: string[] = []) => {
		for (const key of keys) {
			if (seen.has(key)) continue
			seen.add(key)

			const chunk = manifest[key]
			if (!chunk?.file) continue

			imports.push(chunk.file)
			css.push(...(chunk.css ?? []))
			collect(chunk.imports)
		}
	}

	collect(entry.imports)

	return { file: entry.file, css, imports }
}

/**
 * The folders a webview may load this document's images from. Without them the
 * webview refuses the request however correct the `src` is.
 */
export function getDocumentResourceRoots(
	document: vscode.TextDocument
): vscode.Uri[] {
	return [
		vscode.Uri.file(path.dirname(document.uri.fsPath)),
		...(vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri),
	]
}

/**
 * Where the webview resolves image paths that are not already absolute URLs.
 * Relative paths resolve against the document's folder and workspace-absolute
 * ones ("/assets/x.png") against the workspace root - the same rules VSCode's
 * own markdown preview uses. The webview applies these when rendering; the
 * stored src stays as the author wrote it, so saving does not rewrite the file.
 */
export function getImageBaseUris(
	webview: vscode.Webview,
	document: vscode.TextDocument
): ImageBaseUris {
	const documentBaseUri = webview.asWebviewUri(
		vscode.Uri.file(path.dirname(document.uri.fsPath))
	)
	// A document opened outside any workspace has no root to resolve against,
	// so a leading slash falls back to behaving like a relative path.
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
	const workspaceBaseUri = workspaceFolder
		? webview.asWebviewUri(workspaceFolder.uri)
		: documentBaseUri

	return {
		document: documentBaseUri.toString(),
		workspace: workspaceBaseUri.toString(),
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Editor Markdown Notes extension is now active!')

	// Register the custom editor provider
	const provider = new MarkdownEditorProvider(context)
	context.subscriptions.push(provider.register())

	// Opens `uri` — or the active editor's file — with our custom editor. The
	// menu `when` clauses already restrict this to markdown, but the command is
	// also reachable from a keybinding, where nothing has vetted the target.
	const openFile = (uri?: vscode.Uri) => {
		const activeDocument = vscode.window.activeTextEditor?.document
		const target = uri ?? activeDocument?.uri

		if (!target) {
			vscode.window.showErrorMessage('No markdown file selected')
			return
		}

		const isMarkdown =
			target.path.toLowerCase().endsWith('.md') ||
			(target === activeDocument?.uri &&
				activeDocument.languageId === 'markdown')

		if (!isMarkdown) {
			vscode.window.showErrorMessage(
				`Editor Markdown Notes cannot open ${path.basename(target.path)} — it is not a markdown file`
			)
			return
		}

		return vscode.commands.executeCommand('vscode.openWith', target, VIEW_TYPE)
	}

	// Mirrors the toolbar toggles, so they stay reachable when the nav is hidden.
	const selectTheme = async () => {
		const current = provider.getViewOptions().theme
		const items: vscode.QuickPickItem[] = THEME_CHOICES.map(
			({ label, value }) => ({
				label,
				description: value === current ? 'current' : undefined,
			})
		)

		const picked = await vscode.window.showQuickPick(items, {
			title: 'Editor Markdown Notes: theme',
			placeHolder: 'Select a theme',
		})
		if (!picked) return

		const choice = THEME_CHOICES.find(({ label }) => label === picked.label)
		if (choice) await provider.updateViewOptions({ theme: choice.value })
	}

	// Two ids share one handler: `openFile` reads well in the command palette
	// ("Editor Markdown Notes: Open file"), `openMarkdownEditor` reads well in
	// the context menus, where the category is not shown.
	context.subscriptions.push(
		vscode.commands.registerCommand('editor-markdown-notes.openFile', openFile),
		vscode.commands.registerCommand(
			'editor-markdown-notes.openMarkdownEditor',
			openFile
		),
		vscode.commands.registerCommand('editor-markdown-notes.toggleRaw', () =>
			provider.updateViewOptions({ raw: !provider.getViewOptions().raw })
		),
		vscode.commands.registerCommand(
			'editor-markdown-notes.toggleFullWidth',
			() =>
				provider.updateViewOptions({
					fullWidth: !provider.getViewOptions().fullWidth,
				})
		),
		vscode.commands.registerCommand(
			'editor-markdown-notes.selectTheme',
			selectTheme
		)
	)
}

/**
 * Serialises a value for embedding in an inline `<script>`. `JSON.stringify`
 * leaves `<` untouched, so a markdown file containing the literal `</script>`
 * — very common when documenting HTML — would otherwise close the block early
 * and load the editor blank.
 */
function toScriptLiteral(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c')
}

function getNonce() {
	let text = ''
	const possible =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}

// This method is called when your extension is deactivated
export function deactivate() {}
