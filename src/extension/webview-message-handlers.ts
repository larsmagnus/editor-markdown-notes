import * as vscode from 'vscode'

import { recordWebviewLog } from '../lib/webview-diagnostics'
import type { Logger } from '../shared/logger'
import type {
	HostToWebview,
	ShikiThemePayload,
	WebviewToHost,
} from '../shared/messages'

import { createAskClaudeHandlers } from './ask-claude-handlers'
import type { DocumentWriter } from './document-updates'
import { postDocumentUpdate } from './document-updates'
import { openClaudeTerminal } from './open-claude-terminal-command'
import { openInTextEditor } from './open-in-text-editor-command'
import { pickImagePath } from './pick-image-command'
import type { ScrollPositionStore } from './scroll-position-store'
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
	scrollPositions: ScrollPositionStore
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
export type WebviewMessageHandlerSession = {
	handlers: WebviewMessageHandlers
	/**
	 * Covers whatever per-panel state a handler group above needed its own
	 * closure for (currently just `askClaude`'s in-flight request tracking) -
	 * the general contract a handler group with teardown to do returns,
	 * instead of a one-off function `attachPanelSession` has to know by name.
	 */
	disposable: vscode.Disposable
}

export function createWebviewMessageHandlers({
	panel,
	document,
	writer,
	store,
	scrollPositions,
	log,
	broadcastConfig,
	readShikiTheme,
}: HandlerDependencies): WebviewMessageHandlerSession {
	const { askClaude, cancelAsk, disposable } = createAskClaudeHandlers({
		panel,
		document,
	})

	const handlers: WebviewMessageHandlers = {
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
		// Nothing is broadcast back: the offset belongs to this document, and the
		// panel that sent it is already there.
		setScrollTop: (message) => {
			scrollPositions.set(document.uri.toString(), message.scrollTop)
		},
		log: (message) => recordWebviewLog(log, message.level, message.message),
		openInTextEditor: () => {
			void openInTextEditor(document.uri)
		},
		openClaudeTerminal: (message) => {
			openClaudeTerminal(document.uri, store.getSettings(), message.content)
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
		// Also answers the asking panel alone.
		pickImage: async () => {
			const path = await pickImagePath(document, store, log)
			const message: HostToWebview = { type: 'imagePicked', path }
			void panel.webview.postMessage(message)
		},
		askClaude,
		cancelAsk,
	}

	return { handlers, disposable }
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
