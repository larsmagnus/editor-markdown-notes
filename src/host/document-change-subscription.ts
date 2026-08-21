import * as vscode from 'vscode'

import type { DocumentWriter } from './document-updates'

/**
 * Calls back when this document changes underneath the editor.
 *
 * Changes made by the host's own write are skipped: applying the webview's save
 * fires this event, and pushing that text back at the webview mid-edit is the
 * loop `DocumentWriter.isWriting` exists to break.
 */
export function onDocumentChanged(
	document: vscode.TextDocument,
	writer: DocumentWriter,
	onChange: () => void
): vscode.Disposable {
	return vscode.workspace.onDidChangeTextDocument((event) => {
		if (event.document.uri.toString() !== document.uri.toString()) return
		if (writer.isWriting) return

		onChange()
	})
}
