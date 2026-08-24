import * as path from 'path'

import * as vscode from 'vscode'

import type { Logger } from '../shared/logger'
import type { HostToWebview } from '../shared/messages'

import { computeMinimalReplacement } from './minimal-edit'

/** Pushes the document's current text at one panel. */
export function postDocumentUpdate(
	panel: vscode.WebviewPanel,
	document: vscode.TextDocument
) {
	const message: HostToWebview = {
		type: 'update',
		content: document.getText(),
		fileName: path.basename(document.fileName),
	}

	panel.webview.postMessage(message)
}

/**
 * Applies the webview's markdown to the document, dirtying it - writing to
 * disk from here is not this class's job any more; VS Code owns that.
 *
 * Replaces only the span that changed (`computeMinimalReplacement`) instead
 * of the whole document, so a sync does not spam VS Code's own text undo
 * stack, collapse folding, or move the caret in any other editor open on the
 * same file - and skips `applyEdit` altogether when nothing changed.
 *
 * Applying the edit fires `onDidChangeTextDocument`, which would otherwise
 * push the text straight back at the webview mid-edit; `matchesLastWrite` is
 * what the change subscription checks to break that loop. Content rather
 * than a timing window: a wall-clock guard suppresses *whatever* change
 * lands inside it - including a genuine external one racing this write - and
 * stops suppressing a slow edit's own echo the moment the window closes.
 *
 * Writes are queued on one promise chain rather than fired independently, so
 * two syncs in flight at once cannot apply out of order or race which one's
 * text `lastWritten` ends up holding. A failed write does not leave the
 * chain rejected forever - the next sync queued behind it still runs.
 */
export class DocumentWriter {
	private readonly log: Logger
	private lastWritten: string | null = null
	private queue: Promise<void> = Promise.resolve()

	constructor(log: Logger) {
		this.log = log
	}

	public matchesLastWrite(text: string): boolean {
		return this.lastWritten === text
	}

	public write(document: vscode.TextDocument, content: string): Promise<void> {
		this.queue = this.queue
			.then(() => this.applyWrite(document, content))
			.catch((error: unknown) => {
				this.log.error(`Failed to sync the document: ${String(error)}`)
			})

		return this.queue
	}

	private async applyWrite(document: vscode.TextDocument, content: string) {
		const replacement = computeMinimalReplacement(document.getText(), content)
		this.lastWritten = content
		if (!replacement) return

		const edit = new vscode.WorkspaceEdit()

		edit.replace(
			document.uri,
			new vscode.Range(
				document.positionAt(replacement.start),
				document.positionAt(replacement.end)
			),
			replacement.text
		)

		await vscode.workspace.applyEdit(edit)
	}
}
