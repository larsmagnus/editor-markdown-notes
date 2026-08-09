import * as vscode from 'vscode'

import type { HostToWebview } from '../shared/messages'

/**
 * Posts one message to every open panel.
 *
 * Shared state reaches the webviews this way rather than per-panel, which is
 * what keeps two tabs on the same note from disagreeing about the view options.
 */
export function broadcastToPanels(
	panels: Iterable<vscode.WebviewPanel>,
	message: HostToWebview
) {
	for (const panel of panels) {
		panel.webview.postMessage(message)
	}
}
