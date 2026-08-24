import * as vscode from 'vscode'

import type { HostToWebview } from '../shared/messages'

import { hasMessageType } from './message-guards'

/** VS Code aborts a slow save participant on its own; this stays comfortably
 *  under that so a timeout here is always the one that fires. */
const REQUEST_TIMEOUT_MS = 1200

function isLatestContentMessage(
	message: unknown
): message is { type: 'latestContent'; requestId: string; content: string } {
	return hasMessageType(message, 'latestContent')
}

/**
 * Asks `panel`'s webview for its current text, for `onWillSaveTextDocument`
 * to write exact content rather than whatever the last debounced sync
 * happened to carry.
 *
 * Bounded so a hung or unresponsive webview can never block a save: `null`
 * on timeout lets the caller fall back to the document's already-synced
 * text - at most one debounce stale, which is what every save wrote before
 * this existed.
 */
export function requestLatestContent(
	panel: vscode.WebviewPanel
): Promise<string | null> {
	const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

	return new Promise((resolve) => {
		let settled = false
		const settle = (content: string | null) => {
			if (settled) return
			settled = true
			subscription.dispose()
			clearTimeout(timer)
			resolve(content)
		}

		const subscription = panel.webview.onDidReceiveMessage(
			(message: unknown) => {
				if (!isLatestContentMessage(message)) return
				if (message.requestId !== requestId) return
				settle(message.content)
			}
		)

		const timer = setTimeout(() => settle(null), REQUEST_TIMEOUT_MS)

		const request: HostToWebview = { type: 'requestLatest', requestId }
		void panel.webview.postMessage(request)
	})
}
