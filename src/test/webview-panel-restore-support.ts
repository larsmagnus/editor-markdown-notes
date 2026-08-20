import * as vscode from 'vscode'

import { MarkdownEditorProvider } from '../extension/markdown-editor-provider'

export { pause } from './search-test-support'

export const VIEW_TYPE = 'editor-markdown-notes.markdownEditor'

/**
 * `resolveCustomTextEditor` is a callback, not an event (see
 * `.claude/rules/vscode-api.md`), so patching the prototype method before
 * opening the file under test is the only way to get at the real
 * `WebviewPanel` VS Code hands the provider.
 */
export function captureNextPanel(forUri: vscode.Uri) {
	const original = MarkdownEditorProvider.prototype.resolveCustomTextEditor
	let captured: vscode.WebviewPanel | undefined

	MarkdownEditorProvider.prototype.resolveCustomTextEditor = function (
		this: MarkdownEditorProvider,
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		token: vscode.CancellationToken
	) {
		if (document.uri.toString() === forUri.toString()) captured = webviewPanel
		return original.call(this, document, webviewPanel, token)
	}

	return {
		panel: () => captured,
		restore: () => {
			MarkdownEditorProvider.prototype.resolveCustomTextEditor = original
		},
	}
}

/** Records every message the host posts at this panel, in order. */
export function spyOnPostedMessages(panel: vscode.WebviewPanel): unknown[] {
	const messages: unknown[] = []
	const original = panel.webview.postMessage.bind(panel.webview)

	panel.webview.postMessage = ((message: unknown) => {
		messages.push(message)
		return original(message)
	}) as typeof panel.webview.postMessage

	return messages
}

/**
 * Records every message this panel's page sends the host, in order.
 *
 * A plain extra subscription rather than a patch: `onDidReceiveMessage` is an
 * event and takes any number of listeners, so the provider's own handler still
 * runs. Dispose it before the panel closes.
 */
export function spyOnReceivedMessages(panel: vscode.WebviewPanel) {
	const messages: unknown[] = []
	const subscription = panel.webview.onDidReceiveMessage((message: unknown) => {
		messages.push(message)
	})

	return { messages, dispose: () => subscription.dispose() }
}

/**
 * Narrows a spied-on message to one of a given type, filtering out the
 * unrelated traffic (config, Shiki theme) crossing the same channel.
 */
export function messagesOfType(messages: unknown[], type: string): unknown[] {
	return messages.filter(
		(message) =>
			typeof message === 'object' &&
			message !== null &&
			'type' in message &&
			message.type === type
	)
}

/**
 * Narrows a spied-on message to the `update` postMessage the host sends when
 * the document changes, filtering out unrelated broadcasts (config, Shiki
 * theme) the panel may also receive around the same time.
 */
export function isUpdateMessage(
	message: unknown
): message is { type: 'update'; content: string; fileName: string } {
	return (
		typeof message === 'object' &&
		message !== null &&
		'type' in message &&
		message.type === 'update'
	)
}
