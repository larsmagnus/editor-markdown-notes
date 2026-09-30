import {
	formatCount,
	formatFileSize,
	formatRelativeTime,
} from '#src/lib/note-index/format-note-details'
import type { NoteIndexEntry } from '#src/shared/messages'

type NoteIndexCardDetailsProps = {
	entry: NoteIndexEntry
	now: number
}

/** When the note was last edited and how long it is. */
export function NoteIndexCardDetails({
	entry,
	now,
}: NoteIndexCardDetailsProps) {
	const hasCounts = entry.words !== null && entry.characters !== null

	return (
		<span className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
			{entry.modified !== null && (
				<time
					dateTime={new Date(entry.modified).toISOString()}
					title={new Date(entry.modified).toLocaleString()}
				>
					{formatRelativeTime(entry.modified, now)}
				</time>
			)}
			{hasCounts ? (
				<>
					<span>{formatCount(entry.words ?? 0, 'words')}</span>
					<span>{formatCount(entry.characters ?? 0, 'characters')}</span>
				</>
			) : (
				<span>{formatFileSize(entry.size)}</span>
			)}
		</span>
	)
}
