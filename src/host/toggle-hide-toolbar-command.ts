import * as vscode from 'vscode'

import { DEFAULT_SETTINGS } from '../shared/messages'

import { CONFIG_SECTION } from './constants'

/**
 * `hideToolbar` is a workspace/user setting rather than a persisted view option,
 * so it is flipped through the configuration API. The provider picks the change
 * up through `onDidChangeConfiguration` and rebroadcasts on its own.
 */
export async function toggleHideToolbar() {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

	await config.update(
		'hideToolbar',
		!config.get<boolean>('hideToolbar', DEFAULT_SETTINGS.hideToolbar),
		vscode.ConfigurationTarget.Global
	)
}
