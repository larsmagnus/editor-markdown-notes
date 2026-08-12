import * as vscode from 'vscode'

import { buildClaudeCommand } from './claude-prompt'

/**
 * Opens an integrated terminal running `claude`, prompted with `promptTemplate`
 * (`%s` replaced by `uri`'s path relative to the workspace root - the terminal's
 * own default cwd, so `@relativePath` resolves for `claude` without change).
 *
 * The prompt is escaped rather than trusted verbatim because the template
 * itself is user-configured free text, even though it never carries the
 * document's actual content.
 */
export function openClaudeTerminal(uri: vscode.Uri, promptTemplate: string) {
	const relativePath = vscode.workspace.asRelativePath(uri, false)
	const command = buildClaudeCommand(
		promptTemplate,
		relativePath,
		vscode.env.shell
	)

	const terminal = vscode.window.createTerminal('Claude')
	terminal.show()
	terminal.sendText(command, true)
}
