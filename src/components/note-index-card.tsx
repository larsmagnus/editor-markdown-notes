import type { MouseEvent } from 'react'
import { useId } from 'react'

import { NoteIndexCardDetails } from '#src/components/note-index-card-details'
import { NoteIndexCardTags } from '#src/components/note-index-card-tags'
import type { NoteIndexEntry } from '#src/shared/messages'

export type OpenNoteIndexEntry = (
	entry: NoteIndexEntry,
	options: { beside: boolean }
) => void

type NoteIndexCardProps = {
	entry: NoteIndexEntry
	now: number
	onOpen: OpenNoteIndexEntry
}

/**
 * One note in the index. Named by its title alone, so a screen reader hears
 * what the note is before the details.
 */
export function NoteIndexCard({ entry, now, onOpen }: NoteIndexCardProps) {
	const titleId = useId()

	function handleClick(event: MouseEvent) {
		onOpen(entry, { beside: event.metaKey || event.ctrlKey })
	}

	return (
		<button
			type="button"
			aria-labelledby={titleId}
			aria-current={entry.current ? 'page' : undefined}
			onClick={handleClick}
			className="flex h-full w-full flex-col gap-2 rounded-lg border border-border bg-muted/80 p-3 text-left text-sm transition-colors outline-none hover:bg-muted/90 focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:border-primary"
		>
			<span id={titleId} className="line-clamp-2 font-medium text-foreground">
				{entry.title}
			</span>

			<span className="flex min-w-0 flex-col text-xs text-muted-foreground">
				<span className="truncate font-mono">{entry.fileName}</span>
				{entry.directory && (
					<span className="truncate font-mono">{entry.directory}</span>
				)}
			</span>

			{entry.description && (
				<span className="line-clamp-2 text-muted-foreground">
					{entry.description}
				</span>
			)}

			<NoteIndexCardTags entry={entry} />

			<NoteIndexCardDetails entry={entry} now={now} />
		</button>
	)
}
