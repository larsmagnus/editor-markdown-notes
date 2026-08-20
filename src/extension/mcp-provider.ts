import * as vscode from 'vscode'

import { WORKSPACE_SEPARATOR } from '../shared/constants'
import type { Logger } from '../shared/logger'

import { CONFIG_SECTION, MCP_PROVIDER_ID } from './constants'
import type { SettingsStore } from './settings-store'

/**
 * Publishes the writing checks to any MCP client the editor knows about, so an
 * agent editing markdown can reach the same judgement the sidebar shows.
 *
 * The server runs as a child process (`out/mcp/server.mjs`), not inside the
 * host: it keeps the retext stack and a ~550kB word list off the event loop
 * every other extension in this window shares, and opens no port.
 *
 * The user's configuration is handed over as environment variables rather than
 * read by the server itself, which has no `vscode` module. `resolveMcpServer-
 * Definition` runs when the server is actually started, so it reads current
 * values rather than whatever they were at activation; `didChange` fires when
 * they move, which is what makes the editor offer to restart it.
 */
export function registerMcpProvider(
	context: vscode.ExtensionContext,
	store: SettingsStore,
	log: Logger
): vscode.Disposable {
	const didChange = new vscode.EventEmitter<void>()

	const entry = vscode.Uri.joinPath(
		context.extensionUri,
		'out',
		'mcp',
		'server.mjs'
	)

	// Typed to the stdio definition specifically, so `resolveMcpServerDefinition`
	// can set `env` and `cwd` - neither exists on the HTTP half of the union.
	const definitions: vscode.McpServerDefinitionProvider<vscode.McpStdioServerDefinition> =
		{
			onDidChangeMcpServerDefinitions: didChange.event,

			provideMcpServerDefinitions: () => [
				// `process.execPath` is the editor's own Node, so the server does not
				// depend on one being installed or on which version it is.
				new vscode.McpStdioServerDefinition(
					'Markdown Notes Text Tools',
					process.execPath,
					[entry.fsPath],
					{},
					context.extension.packageJSON.version
				),
			],

			resolveMcpServerDefinition: (server) => {
				try {
					const { settings, viewOptions } = store.getConfig()
					const folders = vscode.workspace.workspaceFolders ?? []

					server.env = {
						EMN_RULES: viewOptions.textToolRules.join(','),
						EMN_TARGET_AGE: String(settings.textToolsTargetAge),
						EMN_SPELLING_LANGUAGE: viewOptions.spellingLanguage,
						EMN_IGNORE_WORDS: viewOptions.spellingIgnoreWords.join(','),
						// Every folder, not just the first: a relative path in a
						// multi-root workspace belongs to whichever folder holds the note,
						// and one root alone reports a file that exists as missing.
						EMN_WORKSPACE: folders
							.map((folder) => folder.uri.fsPath)
							.join(WORKSPACE_SEPARATOR),
					}
					// The first folder is only a starting directory; resolution itself
					// tries them all.
					if (folders[0]) server.cwd = folders[0].uri

					log.info(
						`MCP server resolved for ${folders.length} workspace folder(s)`
					)
				} catch (error) {
					// Started anyway, on its own defaults. Throwing here cancels the
					// tool call the agent is waiting on, which is a worse answer than
					// checking against a reading age that is one setting out of date.
					log.error(
						`MCP server configuration could not be read, falling back to defaults: ${
							error instanceof Error ? error.message : String(error)
						}`
					)
				}

				return server
			},
		}

	const provider = vscode.lm.registerMcpServerDefinitionProvider(
		MCP_PROVIDER_ID,
		definitions
	)

	// The definition itself never changes, but its resolved environment does, and
	// the editor only re-resolves after being told the definitions moved. Both
	// halves of the configuration have to be watched: the target age is VSCode
	// settings, while the enabled checks, the English variant and the personal
	// word list live in `globalState`, which raises no configuration event.
	// Missing the second half is what would leave "Add words to dictionary"
	// unable to stop the server flagging the very word it was just given.
	const watchers = [
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration(CONFIG_SECTION)) didChange.fire()
		}),
		store.onDidChangeViewOptions(() => didChange.fire()),
	]

	return vscode.Disposable.from(provider, ...watchers, didChange)
}
