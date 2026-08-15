import * as nodePath from 'path'

import * as vscode from 'vscode'

import { copyImageIntoWorkspace } from './copy-image-into-workspace'
import { isInsideFolder } from './image-copy'
import { relativeImagePath } from './relative-image-path'

/**
 * The path a picked image gets inserted as. A file already inside the
 * document's workspace folder (or, lacking one, its own folder) is
 * referenced where it sits; one picked from elsewhere is copied in first, so
 * the note never points at a path only this machine's filesystem has.
 */
export async function resolvePickedImagePath(
	document: vscode.TextDocument,
	pickedUri: vscode.Uri,
	imageCopyDirectory: string
): Promise<string> {
	const rootFolder = vscode.workspace.getWorkspaceFolder(document.uri)
	const rootDir =
		rootFolder?.uri.fsPath ?? nodePath.dirname(document.uri.fsPath)

	if (isInsideFolder(pickedUri.fsPath, rootDir)) {
		return relativeImagePath(document.uri.fsPath, pickedUri.fsPath)
	}

	return copyImageIntoWorkspace(document.uri, pickedUri, imageCopyDirectory)
}
