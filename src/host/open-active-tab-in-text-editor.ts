import * as vscode from 'vscode'

import { openInTextEditor } from '#src/host/open-in-text-editor-command'

/**
 * Resolves the active tab's document, needed because `activeTextEditor` is
 * unset while a custom editor (not a text editor) has focus.
 */
export function openActiveTabInTextEditor() {
	const tab = vscode.window.tabGroups.activeTabGroup.activeTab
	const uri =
		tab?.input instanceof vscode.TabInputCustom ? tab.input.uri : undefined

	if (!uri) return

	return openInTextEditor(uri)
}
