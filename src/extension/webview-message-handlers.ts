import * as vscode from 'vscode'

import { recordWebviewLog } from '../lib/webview-diagnostics'
import type { Logger } from '../shared/logger'
import type {
	HostToWebview,
	ShikiThemePayload,
	WebviewToHost,
} from '../shared/messages'

import type { DocumentWriter } from './document-updates'
import { postDocumentUpdate } from './document-updates'
import { openInTextEditor } from './open-in-text-editor-command'
import type { SettingsStore } from './settings-store'

type WebviewMessageHandlers = {
	[K in WebviewToHost['type']]: (
		message: Extract<WebviewToHost, { type: K }>
	) => void | Promise<void>
}

type HandlerDependencies = {
	panel: vscode.WebviewPanel
	document: vscode.TextDocument
	writer: DocumentWriter
	store: SettingsStore
	log: Logger
	broadcastConfig: () => void
	readShikiTheme: () => ShikiThemePayload
}

/**
 * What the host does with each kind of message from the webview.
 *
 * A record rather than a switch so the mapped type makes a missing case a
 * compile error the moment `WebviewToHost` gains a member.
 */
export function createWebviewMessageHandlers({
	panel,
	document,
	writer,
	store,
	log,
	broadcastConfig,
	readShikiTheme,
}: HandlerDependencies): WebviewMessageHandlers {
	return {
		save: (message) => writer.save(document, message.content),
		getContent: () => {
			postDocumentUpdate(panel, document)
			// The webview also gets its config injected into the page, but resend
			// it here in case the panel was restored from a cold start.
			broadcastConfig()
		},
		setViewOptions: async (message) => {
			await store.updateViewOptions(message.viewOptions)
			broadcastConfig()
		},
		log: (message) => recordWebviewLog(log, message.level, message.message),
		openInTextEditor: () => {
			void openInTextEditor(document.uri)
		},
		// Answers the asking panel alone. Broadcasting instead would make every
		// other open tab reload its theme and re-highlight for a request that
		// told it nothing new.
		getShikiTheme: () => {
			const message: HostToWebview = {
				type: 'shikiTheme',
				...readShikiTheme(),
			}

			void panel.webview.postMessage(message)
		},
	}
}

/**
 * Dispatches one message to its handler. Indexing the record with the message's
 * own `type` does not narrow the argument alongside it, so the cast is what
 * keeps the table's per-member types while still calling it generically.
 */
export function dispatchWebviewMessage(
	handlers: WebviewMessageHandlers,
	message: WebviewToHost
) {
	const handler = handlers[message.type] as (
		message: WebviewToHost
	) => void | Promise<void>

	handler(message)
}
