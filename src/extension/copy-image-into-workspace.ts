import * as nodePath from 'path'

import * as vscode from 'vscode'

import { resolveCopyFilename } from './image-copy'
import { relativeImagePath } from './relative-image-path'

async function fileExists(uri: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(uri)
		return true
	} catch {
		return false
	}
}

/**
 * Copies a file picked from outside the workspace into `directory` (created
 * if missing, resolved relative to the document's own folder), dodging a
 * filename collision rather than overwriting. Returns the copy's path,
 * relative to the document - what `pickImage` replies with.
 *
 * Goes through `vscode.workspace.fs` rather than Node's `fs`, the only thing
 * in this codebase that touches workspace content directly, so remote and
 * virtual filesystems work the same as a local one.
 */
export async function copyImageIntoWorkspace(
	documentUri: vscode.Uri,
	pickedUri: vscode.Uri,
	directory: string
): Promise<string> {
	const documentDir = nodePath.dirname(documentUri.fsPath)
	const targetDirUri = vscode.Uri.file(nodePath.join(documentDir, directory))
	await vscode.workspace.fs.createDirectory(targetDirUri)

	const fileName = await resolveCopyFilename(
		nodePath.basename(pickedUri.fsPath),
		(candidate) => fileExists(vscode.Uri.joinPath(targetDirUri, candidate))
	)

	const destinationUri = vscode.Uri.joinPath(targetDirUri, fileName)
	await vscode.workspace.fs.copy(pickedUri, destinationUri)

	return relativeImagePath(documentUri.fsPath, destinationUri.fsPath)
}
