import * as vscode from 'vscode'

/** Opens `uri` with VSCode's built-in text editor, leaving our custom editor. */
export function openInTextEditor(uri: vscode.Uri) {
	return vscode.commands.executeCommand('vscode.openWith', uri, 'default')
}
