import * as vscode from 'vscode'

import type { DocumentWriter } from './document-updates'

/**
 * Calls back when this document changes underneath the editor.
 *
 * Changes made by the host's own write are skipped: applying the webview's sync
 * fires this event, and pushing that text back at the webview mid-edit is the
 * loop `DocumentWriter.matchesLastWrite` exists to break. A content check
 * rather than a timing window means a change that coincidentally lands with
 * exactly the text just written is skipped correctly too - the webview
 * already holds it - and a genuine external change is never mistaken for an
 * echo just because it arrived while a write was still settling.
 */
export function onDocumentChanged(
	document: vscode.TextDocument,
	writer: DocumentWriter,
	onChange: () => void
): vscode.Disposable {
	return vscode.workspace.onDidChangeTextDocument((event) => {
		if (event.document.uri.toString() !== document.uri.toString()) return
		if (writer.matchesLastWrite(event.document.getText())) return

		onChange()
	})
}
