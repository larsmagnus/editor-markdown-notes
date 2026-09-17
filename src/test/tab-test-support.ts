import * as vscode from 'vscode'

/** Shared fixtures and helpers for the VS Code tab-integration suites. */

export const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'
export const VIEW_TYPE = 'editor-markdown-notes.markdownEditor'

/** Opening a tab is asynchronous; give it a moment to appear. */
export async function waitForActiveTab(
	predicate: (tab: vscode.Tab) => boolean
) {
	for (let attempt = 0; attempt < 50; attempt++) {
		const tab = vscode.window.tabGroups.activeTabGroup.activeTab
		if (tab && predicate(tab)) return tab

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	return undefined
}

export function isCustomEditorTab(
	tab: vscode.Tab
): tab is vscode.Tab & { input: vscode.TabInputCustom } {
	return (
		tab.input instanceof vscode.TabInputCustom &&
		tab.input.viewType === VIEW_TYPE
	)
}
