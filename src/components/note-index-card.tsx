import type { MouseEvent } from 'react'
import { useId } from 'react'

import { NoteIndexCardDetails } from '#src/components/note-index-card-details'
import { NoteIndexCardDirectory } from '#src/components/note-index-card-directory'
import { NoteIndexCardTags } from '#src/components/note-index-card-tags'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from '#src/components/ui/item'
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
 *
 * Every part has a slot of fixed height, filled or not, so the grid's cards are
 * all the same size whatever a note happens to carry.
 */
export function NoteIndexCard({ entry, now, onOpen }: NoteIndexCardProps) {
	const titleId = useId()

	function handleClick(event: MouseEvent) {
		onOpen(entry, { beside: event.metaKey || event.ctrlKey })
	}

	return (
		<Item
			variant="outline"
			render={
				<button
					type="button"
					aria-labelledby={titleId}
					aria-current={entry.current ? 'page' : undefined}
					onClick={handleClick}
				/>
			}
			className="h-full flex-col flex-nowrap items-stretch gap-2 bg-muted/80 p-3 text-left hover:bg-muted/90 focus-visible:ring-3 aria-[current=page]:border-primary"
		>
			<ItemContent className="flex-none gap-2">
				<ItemTitle
					id={titleId}
					className="line-clamp-2 min-h-[2lh] w-full text-foreground"
				>
					{entry.title}
				</ItemTitle>

				<div className="flex min-w-0 flex-col gap-0.5 text-xs">
					<span className="truncate font-mono font-medium text-foreground">
						{entry.fileName}
					</span>
					<NoteIndexCardDirectory directory={entry.directory} />
				</div>

				<ItemDescription className="min-h-[2lh]">
					{entry.content}
				</ItemDescription>
			</ItemContent>

			<NoteIndexCardTags entry={entry} />

			<NoteIndexCardDetails entry={entry} now={now} />
		</Item>
	)
}
