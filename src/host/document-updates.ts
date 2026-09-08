import * as path from 'path'

import * as vscode from 'vscode'

import { computeMinimalReplacement } from '#src/host/minimal-edit'
import type { Logger } from '#src/shared/logger'
import type { HostToWebview } from '#src/shared/messages'

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
 */
export class DocumentWriter {
	private readonly log: Logger
	private lastWritten: string | null = null
	private queue: Promise<void> = Promise.resolve()

	constructor(log: Logger) {
		this.log = log
	}

	/** Whether `text` is exactly what this writer itself last applied -
	 *  `document-change-subscription.ts` checks this to break the loop
	 *  applying an edit would otherwise cause, by pushing the text straight
	 *  back at the webview mid-edit. */
	public matchesLastWrite(text: string): boolean {
		return this.lastWritten === text
	}

	/**
	 * Queues `content` onto the document behind any write already in flight,
	 * so two syncs racing cannot apply out of order or leave `lastWritten`
	 * holding the wrong one's text.
	 *
	 * Returns the promise for *this* write, which rejects if it failed - the
	 * shared queue behind it recovers regardless, so one failure does not
	 * block every sync queued after it.
	 */
	public write(document: vscode.TextDocument, content: string): Promise<void> {
		const task = this.queue.then(() => this.applyWrite(document, content))

		this.queue = task.catch((error: unknown) => {
			this.log.error(`Failed to sync the document: ${String(error)}`)
		})

		return task
	}

	/** Replaces only the span that changed (`computeMinimalReplacement`)
	 *  rather than the whole document, so a sync does not spam VS Code's own
	 *  text undo stack, collapse folding, or move the caret in any other
	 *  editor open on the same file - and skips `applyEdit` entirely when
	 *  nothing changed. `lastWritten` only updates once `applyEdit` actually
	 *  reports success, or a rejected edit would still read as applied. */
	private async applyWrite(document: vscode.TextDocument, content: string) {
		const replacement = computeMinimalReplacement(document.getText(), content)
		if (!replacement) {
			this.lastWritten = content
			return
		}

		const edit = new vscode.WorkspaceEdit()

		edit.replace(
			document.uri,
			new vscode.Range(
				document.positionAt(replacement.start),
				document.positionAt(replacement.end)
			),
			replacement.text
		)

		const applied = await vscode.workspace.applyEdit(edit)
		if (!applied) throw new Error('applyEdit rejected the edit')

		this.lastWritten = content
	}
}
