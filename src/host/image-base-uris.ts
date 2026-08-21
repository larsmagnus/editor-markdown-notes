import * as path from 'path'

import * as vscode from 'vscode'

import type { ImageBaseUris } from '../shared/messages'

/**
 * The folders a webview may load this document's images from. Without them the
 * webview refuses the request however correct the `src` is.
 */
export function getDocumentResourceRoots(
	document: vscode.TextDocument
): vscode.Uri[] {
	return [
		vscode.Uri.file(path.dirname(document.uri.fsPath)),
		...(vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri),
	]
}

/**
 * Where the webview resolves image paths that are not already absolute URLs.
 * Relative paths resolve against the document's folder and workspace-absolute
 * ones ("/assets/x.png") against the workspace root - the same rules VSCode's
 * own markdown preview uses. The webview applies these when rendering; the
 * stored src stays as the author wrote it, so saving does not rewrite the file.
 */
export function getImageBaseUris(
	webview: vscode.Webview,
	document: vscode.TextDocument
): ImageBaseUris {
	const documentBaseUri = webview.asWebviewUri(
		vscode.Uri.file(path.dirname(document.uri.fsPath))
	)
	// A document opened outside any workspace has no root to resolve against,
	// so a leading slash falls back to behaving like a relative path.
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
	const workspaceBaseUri = workspaceFolder
		? webview.asWebviewUri(workspaceFolder.uri)
		: documentBaseUri

	return {
		document: documentBaseUri.toString(),
		workspace: workspaceBaseUri.toString(),
	}
}
