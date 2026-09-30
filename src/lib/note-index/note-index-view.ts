import { AGENTIC_TAG, isAgenticNote } from '#src/lib/note-index/agentic-note'
import type { NoteIndexEntry } from '#src/shared/messages'

export type NoteIndexSort = 'modified' | 'title' | 'path'

/**
 * The entries whose title, file name, folder or a tag (the derived agentic
 * tag included) contains `query`, ignoring case. The description is left out: it is prose, and matching it
 * turns a short query into noise.
 */
export function filterEntries(
	entries: NoteIndexEntry[],
	query: string
): NoteIndexEntry[] {
	const needle = query.trim().toLowerCase()
	if (!needle) return entries

	return entries.filter((entry) =>
		searchableFields(entry).some((field) =>
			field.toLowerCase().includes(needle)
		)
	)
}

/** Everything a query is matched against, in no particular order. */
function searchableFields(entry: NoteIndexEntry): string[] {
	const agentic = isAgenticNote(entry.directory, entry.fileName)
	return [
		entry.title,
		entry.fileName,
		entry.directory,
		...entry.tags,
		...(agentic ? [AGENTIC_TAG] : []),
	]
}

const COMPARATORS: Record<
	NoteIndexSort,
	(a: NoteIndexEntry, b: NoteIndexEntry) => number
> = {
	modified: (a, b) =>
		(b.modified ?? Number.NEGATIVE_INFINITY) -
		(a.modified ?? Number.NEGATIVE_INFINITY),
	title: (a, b) => compareText(a.title, b.title),
	path: (a, b) => compareText(entryPath(a), entryPath(b)),
}

/** A sorted copy of `entries`; notes with no known edit time sort last. */
export function sortEntries(
	entries: NoteIndexEntry[],
	sort: NoteIndexSort
): NoteIndexEntry[] {
	return [...entries].sort(COMPARATORS[sort])
}

/** Alphabetical, ignoring case and accents. */
function compareText(a: string, b: string): number {
	return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

/** The path a reader sees, without a leading slash for notes at the root. */
function entryPath(entry: NoteIndexEntry): string {
	return entry.directory
		? `${entry.directory}/${entry.fileName}`
		: entry.fileName
}
