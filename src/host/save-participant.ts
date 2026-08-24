import * as vscode from 'vscode'

import type { Logger } from '../shared/logger'
import type { HostToWebview } from '../shared/messages'

import type { DocumentWriter } from './document-updates'
import { requestLatestContent } from './latest-content-request'
import type { SessionsByUri } from './sessions-by-uri'

export type PanelSaveSession = {
	panel: vscode.WebviewPanel
	writer: DocumentWriter
}

/**
 * Registers a panel's save session for the document's URI, and hands back
 * how to undo that when the panel closes. A no-op both ways when the panel
 * session never actually attached (`attachPanelSession`'s cancelled-token
 * case), so the caller does not have to branch on that itself.
 */
export function trackSaveSession(
	sessions: SessionsByUri<PanelSaveSession>,
	uri: string,
	panel: vscode.WebviewPanel,
	writer: DocumentWriter | null
): () => void {
	if (!writer) return () => {}

	const session: PanelSaveSession = { panel, writer }
	sessions.add(uri, session)

	return () => sessions.remove(uri, session)
}

/**
 * Registers the two subscriptions that make any VS Code save exact, and
 * every open panel learn the document just went clean.
 *
 * One registration for the whole extension, not one per panel: two tabs on
 * the same file would otherwise each independently contribute a will-save
 * edit computed from their own webview's answer, and applying both risks
 * VS Code rejecting the save over the overlap. Asking only one representative
 * session avoids that; `onDidSaveTextDocument` still reaches every panel
 * showing the document, since each keeps its own dirty tracking.
 */
export function registerSaveParticipant(
	getSessions: (uri: vscode.Uri) => ReadonlySet<PanelSaveSession> | undefined,
	log: Logger
): vscode.Disposable {
	return vscode.Disposable.from(
		// Makes the keystroke, Save All, `files.autoSave` and the close prompt
		// all write exact text - not whatever the last debounced sync carried -
		// by asking the webview for its current text and applying it through
		// the writer before the save proceeds, rather than through the
		// contributed-edits mechanism `waitUntil` also supports: reusing the
		// writer keeps `matchesLastWrite` correct, so the host does not echo
		// this text straight back at the webview as if it were an outside edit.
		vscode.workspace.onWillSaveTextDocument((event) => {
			const session = getSessions(event.document.uri)?.values().next().value
			if (!session) return

			event.waitUntil(
				requestLatestContent(session.panel).then(async (content) => {
					if (content === null) {
						log.warn(
							'Timed out asking the webview for its current text before saving; saving the last synced text instead.'
						)
						return []
					}

					await session.writer.write(event.document, content)
					return []
				})
			)
		}),
		vscode.workspace.onDidSaveTextDocument((document) => {
			const sessions = getSessions(document.uri)
			if (!sessions) return

			const message: HostToWebview = { type: 'documentSaved' }
			for (const { panel } of sessions) void panel.webview.postMessage(message)
		})
	)
}
