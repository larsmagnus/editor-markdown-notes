import * as vscode from 'vscode'

import type { ExtensionSettings } from '../shared/messages'

import { buildClaudeCommand } from './claude-prompt'

/**
 * Opens an integrated terminal running `claude`, prompted about `uri` by its
 * path relative to the workspace root - the terminal's own default cwd, so
 * `@relativePath` resolves for `claude` without change.
 *
 * `content` is an excerpt of the document to narrow the prompt to (a diagram's
 * source, so far); passing one switches to the inline template. The prompt is
 * escaped rather than trusted verbatim: the templates are user-configured free
 * text, and `content` arrives from the webview.
 */
export function openClaudeTerminal(
	uri: vscode.Uri,
	settings: ExtensionSettings,
	content?: string
) {
	// Typed as a string, but it crosses the webview boundary as JSON, and the
	// host has no zod (it ships without `node_modules`) to insist on that.
	const excerpt = typeof content === 'string' ? content : undefined

	const template =
		excerpt === undefined
			? settings.claudePromptTemplate
			: settings.claudeInlinePromptTemplate

	const path = vscode.workspace.asRelativePath(uri, false)
	const command = buildClaudeCommand(
		template,
		{ path, content: excerpt },
		vscode.env.shell
	)

	// A terminal defaults to the *first* workspace folder, while the path above
	// is relative to the one holding this note - the two differ in a multi-root
	// workspace, leaving `@relativePath` pointing at nothing.
	const terminal = vscode.window.createTerminal({
		name: 'Claude',
		cwd: vscode.workspace.getWorkspaceFolder(uri)?.uri,
	})
	terminal.show()
	terminal.sendText(command, true)
}
