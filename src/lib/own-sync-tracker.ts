const HISTORY_SIZE = 5

/**
 * Undoes exactly what `files.trimTrailingWhitespace` and
 * `files.insertFinalNewline` do to a file on save, so text touched up by
 * either still compares equal to what was synced before them.
 *
 * `tiptap-markdown`'s `HardBreak` serializer writes a hard break as a
 * trailing `\` rather than the GFM convention of two trailing spaces, so
 * trimming trailing whitespace here can never eat one - there is none to
 * trim.
 */
function normalize(text: string): string {
	const trimmed = text
		.split('\n')
		.map((line) => line.replace(/[ \t]+$/, ''))
		.join('\n')

	if (trimmed === '' || trimmed.endsWith('\n')) return trimmed
	return `${trimmed}\n`
}

/**
 * Remembers the last few texts this side synced, to tell its own echo apart
 * from a genuine external change.
 *
 * A single last-value ref loses in two real cases: two panels on the same
 * document, where panel B has to recognise panel A's write as well as its
 * own; and a second sync queued before the first one's echo arrives, which a
 * one-slot ref would already have overwritten by the time that echo shows up.
 */
export function createOwnSyncTracker() {
	const recent: string[] = []

	return {
		record(text: string) {
			recent.push(normalize(text))
			if (recent.length > HISTORY_SIZE) recent.shift()
		},
		matches(text: string): boolean {
			return recent.includes(normalize(text))
		},
	}
}
