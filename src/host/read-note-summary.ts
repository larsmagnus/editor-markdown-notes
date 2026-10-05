import * as vscode from 'vscode'

import type { IndexedFile } from '#src/host/note-index-entry'
import { summarizeNote } from '#src/lib/host/note-summary'
import type { NoteSummary } from '#src/shared/messages'

/** Past this, a note is listed by name and size alone rather than read. */
const MAX_READ_BYTES = 1024 * 1024

/**
 * A note's summary, or its bare file name for one too large or too unreadable
 * to summarize.
 */
export async function readNoteSummary(
	file: IndexedFile,
	fileName: string
): Promise<NoteSummary> {
	const unread = {
		title: fileName,
		content: null,
		tags: [],
		characters: null,
		words: null,
	}
	if (file.size > MAX_READ_BYTES) return unread

	try {
		const bytes = await vscode.workspace.fs.readFile(file.uri)
		return summarizeNote(Buffer.from(bytes).toString('utf8'), fileName)
	} catch {
		return unread
	}
}
