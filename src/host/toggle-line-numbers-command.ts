import * as vscode from 'vscode'

import { CONFIG_SECTION } from '#src/host/constants'
import { DEFAULT_SETTINGS } from '#src/shared/messages'

/**
 * Writes where the value in effect lives, so a workspace override isn't left
 * shadowing a toggle written to the user settings.
 */
function settingTarget(
	inspected: ReturnType<vscode.WorkspaceConfiguration['inspect']>
): vscode.ConfigurationTarget {
	if (inspected?.workspaceFolderValue !== undefined)
		return vscode.ConfigurationTarget.WorkspaceFolder
	if (inspected?.workspaceValue !== undefined)
		return vscode.ConfigurationTarget.Workspace
	return vscode.ConfigurationTarget.Global
}

/**
 * `lineNumbers` is a user setting rather than a persisted view option, so it is
 * flipped through the configuration API. The provider picks the change up
 * through `onDidChangeConfiguration` and rebroadcasts on its own.
 */
export async function toggleLineNumbers() {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

	await config.update(
		'lineNumbers',
		!config.get<boolean>('lineNumbers', DEFAULT_SETTINGS.lineNumbers),
		settingTarget(config.inspect<boolean>('lineNumbers'))
	)
}
