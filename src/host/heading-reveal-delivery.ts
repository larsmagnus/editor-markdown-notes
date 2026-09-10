import type * as vscode from 'vscode'

import type { PendingHeadingRevealStore } from '#src/host/pending-heading-reveal-store'
import type { SessionsByUri } from '#src/host/sessions-by-uri'
import type { HostToWebview } from '#src/shared/messages'

/**
 * Delivers a link's `#hash` to whichever of `targetUri`'s panels are already
 * open, or - when none are - records it in `pendingReveals` for
 * `resolveCustomTextEditor` to inject into the one it is about to build.
 *
 * Posted to every open panel for the uri, not just the first: cheap, and
 * correct even with the same note open in two tabs, mirroring how
 * `broadcastToPanels` already treats more than one panel per document as fine
 * to fan out to.
 */
export function deliverHeadingReveal(
	targetUri: vscode.Uri,
	hash: string,
	panelsByUri: SessionsByUri<vscode.WebviewPanel>,
	pendingReveals: PendingHeadingRevealStore
): void {
	const panels = panelsByUri.get(targetUri.toString())

	if (!panels || panels.size === 0) {
		pendingReveals.set(targetUri, hash)
		return
	}

	const message: HostToWebview = { type: 'revealHeading', hash }
	for (const panel of panels) {
		void panel.webview.postMessage(message)
	}
}
