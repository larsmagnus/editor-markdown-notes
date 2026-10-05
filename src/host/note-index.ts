import type * as vscode from 'vscode'

import { filterNoteUris } from '#src/host/filter-note-uris'
import { findNoteUris } from '#src/host/find-note-uris'
import { inBatches } from '#src/host/in-batches'
import type { IndexedFile } from '#src/host/note-index-entry'
import { statFile, toEntry } from '#src/host/note-index-entry'
import type { NoteIndexFilters } from '#src/lib/host/note-index-filter'
import { keepNewest } from '#src/lib/host/note-index-scope'
import type { NoteIndex } from '#src/shared/messages'
import { NOTE_INDEX_LIMIT } from '#src/shared/messages'

/**
 * Every note in the workspace, read fresh from disk.
 *
 * Rescanned on each request rather than cached behind a file watcher: nothing
 * can go stale, and the index is opened far less often than files change.
 * Filtered before the `NOTE_INDEX_LIMIT` cut, so notes the author has asked not
 * to see cannot crowd out the ones they have.
 */
export async function buildNoteIndex(
	current: vscode.Uri,
	filters: NoteIndexFilters
): Promise<NoteIndex> {
	const { uris, directories, gitUnavailable } = await filterNoteUris(
		await findNoteUris(current),
		filters
	)
	const files = (await inBatches(uris, statFile)).filter(
		(file): file is IndexedFile => file !== null
	)
	const entries = await inBatches(keepNewest(files, NOTE_INDEX_LIMIT), (file) =>
		toEntry(file, current)
	)

	return {
		entries,
		total: files.length,
		directories,
		hiddenDirectories: [...filters.hiddenDirectories],
		gitUnavailable,
	}
}
