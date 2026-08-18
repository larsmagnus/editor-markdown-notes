import * as vscode from 'vscode'

// Relative imports throughout the host, and `tsconfig.extension.json` has no
// `paths` mapping so an `@/` alias fails typecheck rather than at runtime: `tsc`
// emits aliases verbatim and the extension would die with MODULE_NOT_FOUND.
//
// This file must stay `src/extension.ts` alongside the `src/extension/` folder.
// `package.json` points `main` at `./out/extension.js`; turning this into
// `src/extension/index.ts` would resolve to `out/extension/index.js` and break
// activation.
import { registerCommands } from './extension/commands'
import { MarkdownEditorProvider } from './extension/markdown-editor-provider'
import { installProbeListeners } from './extension/probe-listeners'
import { ScrollPositionStore } from './extension/scroll-position-store'
import { SettingsStore } from './extension/settings-store'
import { ShikiThemeStore } from './extension/shiki-theme-store'

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
		installProbeListeners(log),
		provider.register(),
		registerCommands(store, log, provider.broadcastConfig)
	)
}

// This method is called when your extension is deactivated
export function deactivate() {}
