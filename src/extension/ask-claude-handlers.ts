import * as path from 'node:path'

import * as vscode from 'vscode'

import type { HostToWebview } from '../shared/messages'

import { runClaudeAsk } from './claude-agent'

type AskClaudeHandlersOptions = {
	panel: vscode.WebviewPanel
	document: vscode.TextDocument
}

/**
 * The `askClaude`/`cancelAsk` message handlers, pulled out of
 * `webview-message-handlers.ts` to keep that file's complexity score under
 * the repo's cap - request tracking (`activeAskControllers`) needs its own
 * closure regardless of where it lives.
 */
export function createAskClaudeHandlers({
	panel,
	document,
}: AskClaudeHandlersOptions) {
	const activeAskControllers = new Map<string, AbortController>()

	const askClaude = (message: {
		requestId: string
		prompt: string
		selectedText?: string
	}) => {
		const controller = new AbortController()
		activeAskControllers.set(message.requestId, controller)

		const onChunk = (text: string) => {
			const chunk: HostToWebview = {
				type: 'askChunk',
				requestId: message.requestId,
				text,
			}
			void panel.webview.postMessage(chunk)
		}

		// A note outside any workspace folder (opened directly) has none - fall
		// back to its own containing directory so `cwd` is still somewhere real,
		// and to its bare filename for `path` so the `@`-reference built from it
		// stays relative to that same `cwd` instead of turning into an absolute
		// path `asRelativePath` would otherwise return unchanged in this case.
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
		const cwd =
			workspaceFolder?.uri.fsPath ??
			vscode.Uri.joinPath(document.uri, '..').fsPath
		const relativePath = workspaceFolder
			? vscode.workspace.asRelativePath(document.uri, false)
			: path.basename(document.uri.fsPath)

		void runClaudeAsk(
			message.prompt,
			{ path: relativePath, selectedText: message.selectedText },
			cwd,
			onChunk,
			controller
		)
			.then((result) => {
				activeAskControllers.delete(message.requestId)

				const reply: HostToWebview = result.ok
					? { type: 'askDone', requestId: message.requestId }
					: {
							type: 'askError',
							requestId: message.requestId,
							error: result.error,
						}
				void panel.webview.postMessage(reply)
			})
			.catch((error: unknown) => {
				activeAskControllers.delete(message.requestId)
				const reply: HostToWebview = {
					type: 'askError',
					requestId: message.requestId,
					error: error instanceof Error ? error.message : 'Ask Claude failed.',
				}
				void panel.webview.postMessage(reply)
			})
	}

	const cancelAsk = (message: { requestId: string }) => {
		activeAskControllers.get(message.requestId)?.abort()
		activeAskControllers.delete(message.requestId)
	}

	// Otherwise a streaming ask keeps calling `postMessage` on a webview whose
	// panel is already gone.
	const disposable = new vscode.Disposable(() => {
		for (const controller of activeAskControllers.values()) controller.abort()
		activeAskControllers.clear()
	})

	return { askClaude, cancelAsk, disposable }
}
