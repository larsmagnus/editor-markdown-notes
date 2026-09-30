import * as path from 'path'

import * as vscode from 'vscode'

import { findNoteUris } from '#src/host/find-note-uris'
import { inBatches } from '#src/host/in-batches'
import { readNoteSummary } from '#src/host/read-note-summary'
import { keepNewest } from '#src/lib/host/note-index-scope'
import type { NoteIndex, NoteIndexEntry } from '#src/shared/messages'
import { NOTE_INDEX_LIMIT } from '#src/shared/messages'

export type IndexedFile = { uri: vscode.Uri; mtime: number; size: number }

/**
 * Every note in the workspace, read fresh from disk.
 *
 * Rescanned on each request rather than cached behind a file watcher: nothing
 * can go stale, and the index is opened far less often than files change.
 */
export async function buildNoteIndex(current: vscode.Uri): Promise<NoteIndex> {
	const uris = await findNoteUris(current)
	const files = (await inBatches(uris, statFile)).filter(
		(file): file is IndexedFile => file !== null
	)
	const entries = await inBatches(keepNewest(files, NOTE_INDEX_LIMIT), (file) =>
		toEntry(file, current)
	)

	return { entries, total: files.length }
}

/** `null` for a file deleted between the search and the stat. */
async function statFile(uri: vscode.Uri): Promise<IndexedFile | null> {
	try {
		const { mtime, size } = await vscode.workspace.fs.stat(uri)
		return { uri, mtime, size }
	} catch {
		return null
	}
}

/** A card's worth of detail about one file, `current` against the note the index opened from. */
async function toEntry(
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
