import * as vscode from 'vscode'

import type { Logger } from '../shared/logger'
import type { HostToWebview } from '../shared/messages'

import { broadcastToPanels } from './broadcast'
import { CONFIG_SECTION, VIEW_TYPE } from './constants'
import { attachPanelSession } from './panel-session'
import { probePanel } from './probe-panel'
import type { ScrollPositionStore } from './scroll-position-store'
import type { SettingsStore } from './settings-store'
import type { ShikiThemeStore } from './shiki-theme-store'

/**
 * The custom editor itself. Owns the set of open panels, which is what lets a
 * change in one tab reach all the others.
 */
export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
	private readonly context: vscode.ExtensionContext
	private readonly store: SettingsStore
	private readonly shikiThemeStore: ShikiThemeStore
	private readonly scrollPositions: ScrollPositionStore
	private readonly log: Logger
	private readonly panels = new Set<vscode.WebviewPanel>()

	constructor(
		context: vscode.ExtensionContext,
		store: SettingsStore,
		shikiThemeStore: ShikiThemeStore,
		scrollPositions: ScrollPositionStore,
		log: Logger
	) {
		this.context = context
		this.store = store
		this.shikiThemeStore = shikiThemeStore
		this.scrollPositions = scrollPositions
		this.log = log
	}

	public register(): vscode.Disposable {
		return vscode.Disposable.from(
			// `enableFindWidget` is what makes Cmd/Ctrl+F trigger VSCode's built-in
			// webview find widget (searches rendered DOM text); it can only be set
			// here, not on `webviewPanel.options`, which is read-only per-panel.
			vscode.window.registerCustomEditorProvider(VIEW_TYPE, this, {
				webviewOptions: { enableFindWidget: true },
			}),
			vscode.workspace.onDidChangeConfiguration((event) => {
				if (event.affectsConfiguration(CONFIG_SECTION)) this.broadcastConfig()
			}),
			this.shikiThemeStore.onDidChangeTheme(this.broadcastShikiTheme)
		)
	}

	/** Keeps every open editor tab in sync with the shared state. */
	public broadcastConfig = () => {
		const message: HostToWebview = {
			type: 'config',
			...this.store.getConfig(),
		}

		broadcastToPanels(this.panels, message)
	}

	/** Keeps every open editor tab's syntax highlighting in sync with the
	 *  user's actual active VS Code color theme. */
	public broadcastShikiTheme = () => {
		const message: HostToWebview = {
			type: 'shikiTheme',
			...this.shikiThemeStore.getTheme(),
		}

		broadcastToPanels(this.panels, message)
	}

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		const session = attachPanelSession({
			panel: webviewPanel,
			document,
			extensionPath: this.context.extensionPath,
			store: this.store,
			scrollPositions: this.scrollPositions,
			log: this.log,
			broadcastConfig: this.broadcastConfig,
			readShikiTheme: () => this.shikiThemeStore.getTheme(),
		})

		const probe = probePanel(webviewPanel, document, this.log)

		this.panels.add(webviewPanel)

		webviewPanel.onDidDispose(() => {
			this.panels.delete(webviewPanel)
			session.dispose()
			probe.dispose()
		})
	}
}
