import type * as vscode from 'vscode'

import { SessionsByUri } from '#src/host/sessions-by-uri'

/**
 * Every open panel, tracked two ways: plainly, for broadcasting shared state
 * to every tab regardless of which document it holds, and by document uri,
 * for delivering a link's heading reveal to an already-open target.
 */
export class PanelRegistry {
	public readonly panels = new Set<vscode.WebviewPanel>()
	public readonly panelsByUri = new SessionsByUri<vscode.WebviewPanel>()

	/**
	 * `ready` is false on a cancelled session (`attachPanelSession` returned
	 * before wiring `onDidReceiveMessage` or setting `webview.html` on one), so
	 * registering it in `panelsByUri` would let a heading reveal `postMessage`
	 * into a page that will never read it - silently lost rather than falling
	 * back to the pending-reveal queue, which is worse than not registering it.
	 */
	public track(uri: string, panel: vscode.WebviewPanel, ready: boolean): void {
		this.panels.add(panel)
		if (ready) this.panelsByUri.add(uri, panel)
	}

	public untrack(uri: string, panel: vscode.WebviewPanel): void {
		this.panels.delete(panel)
		this.panelsByUri.remove(uri, panel)
	}
}
