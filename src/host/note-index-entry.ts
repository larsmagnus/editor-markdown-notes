import * as path from 'path'

import * as vscode from 'vscode'

import { readNoteSummary } from '#src/host/read-note-summary'
import type { NoteIndexEntry } from '#src/shared/messages'

export type IndexedFile = { uri: vscode.Uri; mtime: number; size: number }

/** `null` for a file deleted between the search and the stat. */
export async function statFile(uri: vscode.Uri): Promise<IndexedFile | null> {
	try {
		const { mtime, size } = await vscode.workspace.fs.stat(uri)
		return { uri, mtime, size }
	} catch {
		return null
	}
}

/** A card's worth of detail about one file, `current` against the note the index opened from. */
export async function toEntry(
	file: IndexedFile,
	current: vscode.Uri
): Promise<NoteIndexEntry> {
	const fileName = path.posix.basename(file.uri.path)
	const directory = path.posix.dirname(
		vscode.workspace.asRelativePath(file.uri)
	)

	return {
		...(await readNoteSummary(file, fileName)),
		uri: file.uri.toString(),
		fileName,
		directory: directory === '.' ? '' : directory,
		modified: file.mtime,
		size: file.size,
		current: file.uri.toString() === current.toString(),
	}
}
