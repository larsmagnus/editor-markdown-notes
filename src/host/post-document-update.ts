import * as path from 'path'

import type * as vscode from 'vscode'

import { toLf } from '#src/lib/host/line-endings'
import type { HostToWebview } from '#src/shared/messages'

/** Pushes the document's current text at one panel. */
export function postDocumentUpdate(
	panel: vscode.WebviewPanel,
	document: vscode.TextDocument
) {
	const message: HostToWebview = {
		type: 'update',
		content: toLf(document.getText()),
		fileName: path.basename(document.fileName),
	}

	panel.webview.postMessage(message)
}
