import * as vscode from 'vscode'

// Relative imports throughout the host, and `tsconfig.host.json` has no
// `paths` mapping so an `@/` alias fails typecheck rather than at runtime: `tsc`
// emits aliases verbatim and the extension would die with MODULE_NOT_FOUND.
//
// This file must stay `src/host.ts` alongside the `src/host/` folder.
// `package.json` points `main` at `./out/host.js`; turning this into
// `src/host/index.ts` would resolve to `out/host/index.js` and break
// activation.
import { registerCommands } from './host/commands'
import { MarkdownEditorProvider } from './host/markdown-editor-provider'
import { registerMcpProvider } from './host/mcp-provider'
import { ScrollPositionStore } from './host/scroll-position-store'
import { SettingsStore } from './host/settings-store'
import { ShikiThemeStore } from './host/shiki-theme-store'

export function activate(context: vscode.ExtensionContext) {
	// Surfaced as "Editor Markdown Notes" in the Output panel. `log: true` makes
	// it a LogOutputChannel, so entries carry a timestamp and level and the
	// panel's own level picker filters them.
	const log = vscode.window.createOutputChannel('Editor Markdown Notes', {
		log: true,
	})
	context.subscriptions.push(log)

	log.info('Extension activated')

	const store = new SettingsStore(context)
	const shikiThemeStore = new ShikiThemeStore(log)
	const scrollPositions = new ScrollPositionStore()
	const provider = new MarkdownEditorProvider(
		context,
		store,
		shikiThemeStore,
		scrollPositions,
		log
	)

	context.subscriptions.push(
		provider.register(),
		registerCommands(store, log, provider.broadcastConfig),
		registerMcpProvider(context, store, log)
	)
}

// This method is called when your extension is deactivated
export function deactivate() {}
