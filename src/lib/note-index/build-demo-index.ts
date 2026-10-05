import { summarizeNote } from '#src/lib/host/note-summary'
import type { NoteIndex } from '#src/shared/messages'

export type DemoFile = { value: string; content: string }

/** The demo notes have no folder or edit time, only their fetched text. */
export function buildDemoIndex(files: DemoFile[], fileName: string): NoteIndex {
	const entries = files.map(({ value, content }) => ({
		...summarizeNote(content, value),
		uri: value,
		fileName: value,
		directory: '',
		modified: null,
		size: content.length,
		current: value === fileName,
	}))

	return {
		entries,
		total: entries.length,
		directories: [],
		hiddenDirectories: [],
		gitUnavailable: false,
	}
}
