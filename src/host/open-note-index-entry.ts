import * as vscode from 'vscode'

import { VIEW_TYPE } from '#src/host/constants'
import { isMarkdownFile } from '#src/lib/host/markdown-file-extensions'

/**
 * Opens a note the index listed in the custom editor, as a pinned tab rather
 * than a preview the next click would replace.
 */
export async function openNoteIndexEntry(
	uri: string,
	beside: boolean
): Promise<void> {
	const target = vscode.Uri.parse(uri, true)
	if (!isMarkdownFile(target.path)) return

	await vscode.commands.executeCommand('vscode.openWith', target, VIEW_TYPE, {
		viewColumn: beside ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
		preview: false,
	})
}
