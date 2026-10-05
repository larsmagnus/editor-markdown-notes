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

/**
 * When the note was last edited and how long it is, on one line. Each part
 * gives way with an ellipsis rather than wrapping, since the card has no room
 * for a second line.
 */
export function NoteIndexCardDetails({
	entry,
	now,
}: NoteIndexCardDetailsProps) {
	const hasCounts = entry.words !== null && entry.characters !== null

	return (
		<span className="mt-auto flex min-w-0 gap-x-3 text-xs text-muted-foreground">
			{entry.modified !== null && (
				<time
					className="min-w-0 truncate"
					dateTime={new Date(entry.modified).toISOString()}
					title={new Date(entry.modified).toLocaleString()}
				>
					{formatRelativeTime(entry.modified, now)}
				</time>
			)}
			{hasCounts ? (
				<>
					<span className="min-w-0 truncate">
						{formatCount(entry.words ?? 0, 'words')}
					</span>
					<span className="min-w-0 truncate">
						{formatCount(entry.characters ?? 0, 'chars')}
					</span>
				</>
			) : (
				<span className="min-w-0 truncate">{formatFileSize(entry.size)}</span>
			)}
		</span>
	)
}
