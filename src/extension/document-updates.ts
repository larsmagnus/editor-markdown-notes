import * as path from 'path'

import * as vscode from 'vscode'

import type { HostToWebview } from '../shared/messages'

/** Pushes the document's current text at one panel. */
export function postDocumentUpdate(
	panel: vscode.WebviewPanel,
	document: vscode.TextDocument
) {
	const message: HostToWebview = {
		type: 'update',
		content: document.getText(),
		fileName: path.basename(document.fileName),
	}

	panel.webview.postMessage(message)
}

/**
 * Writes the webview's markdown back to the document.
 *
 * Applying the edit fires `onDidChangeTextDocument`, which would otherwise push
 * the text straight back at the webview mid-edit; `isWriting` is what breaks
 * that loop.
 */
export class DocumentWriter {
	private writing = false

	public get isWriting(): boolean {
		return this.writing
	}

	public async save(document: vscode.TextDocument, content: string) {
		this.writing = true

		try {
			const edit = new vscode.WorkspaceEdit()

			edit.replace(
				document.uri,
				new vscode.Range(0, 0, document.lineCount, 0),
				content
			)

			await vscode.workspace.applyEdit(edit)
			await document.save()
		} finally {
			// Cleared on a later tick: the change events the edit produced are
			// delivered after this promise settles.
			setTimeout(() => {
				this.writing = false
			}, 100)
		}
	}
}
