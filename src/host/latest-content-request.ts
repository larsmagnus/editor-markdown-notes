import * as vscode from 'vscode'

import { hasMessageType } from '#src/host/message-guards'
import type { HostToWebview } from '#src/shared/messages'

/** VS Code aborts a slow save participant on its own; this stays comfortably
 *  under that so a timeout here is always the one that fires. */
const REQUEST_TIMEOUT_MS = 1200

function isLatestContentMessage(message: unknown): message is {
	type: 'latestContent'
	requestId: string
	content: string | null
} {
	return hasMessageType(message, 'latestContent')
}

/**
 * Asks `panel`'s webview for its current text, for `onWillSaveTextDocument`
 * to write exact content rather than whatever the last debounced sync
 * happened to carry.
 *
 * Bounded so a hung or unresponsive webview can never block a save: `false`
 * on timeout lets the caller fall back to the document's already-synced
 * text - at most one debounce stale, which is what every save wrote before
 * this existed. The webview can also answer `null` itself, meaning nothing
 * is pending; both cases resolve with `content: null`, but only the timeout
 * is worth a warning log, so the caller gets `timedOut` to tell them apart.
 */
export function requestLatestContent(
	panel: vscode.WebviewPanel
): Promise<{ content: string | null; timedOut: boolean }> {
	const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

	return new Promise((resolve) => {
		let settled = false
		const settle = (content: string | null, timedOut: boolean) => {
			if (settled) return
			settled = true
			subscription.dispose()
			clearTimeout(timer)
			resolve({ content, timedOut })
		}

		const subscription = panel.webview.onDidReceiveMessage(
			(message: unknown) => {
				if (!isLatestContentMessage(message)) return
				if (message.requestId !== requestId) return
				settle(message.content, false)
			}
		)

		const timer = setTimeout(() => settle(null, true), REQUEST_TIMEOUT_MS)

		const request: HostToWebview = { type: 'requestLatest', requestId }
		void panel.webview.postMessage(request)
	})
}
