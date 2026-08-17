import * as path from 'path'

import * as vscode from 'vscode'

import type { Logger } from '../shared/logger'
import type { ShikiThemePayload, WebviewToHost } from '../shared/messages'

import { onDocumentChanged } from './document-change-subscription'
import { DocumentWriter, postDocumentUpdate } from './document-updates'
import { getDocumentResourceRoots } from './image-base-uris'
import type { SettingsStore } from './settings-store'
import { buildWebviewDocument } from './webview-document'
import {
	createWebviewMessageHandlers,
	dispatchWebviewMessage,
} from './webview-message-handlers'

type PanelSessionOptions = {
	panel: vscode.WebviewPanel
	document: vscode.TextDocument
	extensionPath: string
	store: SettingsStore
	log: Logger
	/** Re-broadcasts to every open panel, not just this one. */
	broadcastConfig: () => void
	/** The active VS Code theme, for answering this panel's own request. */
	readShikiTheme: () => ShikiThemePayload
}

/**
 * Wires one open note to one webview panel, for as long as the panel lives.
 *
 * Returns a disposable covering every subscription it made; the caller disposes
 * it when the panel closes.
 */
export function attachPanelSession({
	panel,
	document,
	extensionPath,
	store,
	log,
	broadcastConfig,
	readShikiTheme,
}: PanelSessionOptions): vscode.Disposable {
	const writer = new DocumentWriter()

	panel.webview.options = {
		enableScripts: true,
		localResourceRoots: [
			vscode.Uri.file(path.join(extensionPath, 'dist')),
			vscode.Uri.file(path.join(extensionPath, 'out')),
			...getDocumentResourceRoots(document),
		],
	}

	panel.webview.html = buildWebviewDocument({
		webview: panel.webview,
		document,
		extensionPath,
		config: store.getConfig(),
		log,
	})

	const { handlers, disposable } = createWebviewMessageHandlers({
		panel,
		document,
		writer,
		store,
		log,
		broadcastConfig,
		readShikiTheme,
	})

	return vscode.Disposable.from(
		onDocumentChanged(document, writer, () =>
			postDocumentUpdate(panel, document)
		),
		panel.webview.onDidReceiveMessage((message: WebviewToHost) =>
			dispatchWebviewMessage(handlers, message)
		),
		disposable
	)
}
